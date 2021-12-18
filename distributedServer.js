/** @param {NS} ns **/

const HACK_SCRIPT = "distributedHack.js";
const GROW = "grow";
const WEAKEN = "weaken";
const HACK = "hack";
const READ_PORT = 1;
const WRITE_PORT = 2;
let requestedRam = 8;
let servers = [];

async function sendMessage(ns, target, command) {
	ns.print("SENT: " + target + " " + command);
	return await ns.tryWritePort(WRITE_PORT, target + " " + command);
}

async function isProcessRunning(ns, script, serverName) {
	const processes = ns.ps(serverName);
	let isScriptRunning = false;
	for (const process of processes) {
		if (process.filename == script) {
			isScriptRunning = true;
			break;
		}
	}
	return isScriptRunning;
}

async function startHack(ns, serverName) {
	const ramUsage = ns.getScriptRam(HACK_SCRIPT, serverName);
	const maxRam = ns.getServerMaxRam(serverName);
	const threads = Math.floor(maxRam / ramUsage);
	await ns.scp(HACK_SCRIPT, serverName);
	await ns.exec(HACK_SCRIPT, serverName, threads, threads);
}

async function start(ns) {
	const purchasedServers = ns.getPurchasedServers(true);
	for (const server of purchasedServers) {
		if (await isProcessRunning(ns, HACK_SCRIPT, server)) {
			continue;
		}
		await startHack(ns, server);
	}
}

function getLowestServers(ns, servers, currentRam) {
	const serversToUpgrade = [];
	for(const serverName of servers) {
		const ram = ns.getServerMaxRam(serverName);
		if (ram < currentRam) {
			serversToUpgrade.push(serverName);
		}
	}
	return serversToUpgrade;
}

async function getStartingRam(ns) {
	let ram = 8;
	let money = ns.args[2] || ns.getServerMoneyAvailable("home");
	while (money > ns.getPurchasedServerCost(ram * 2)) {
		ram *= 2;
	}
	return ram;
}

async function handleServerUpgrades(ns) {
	const serverCost = ns.getPurchasedServerCost(requestedRam)
	ns.print("Server Cost: " + serverCost);
	const money = ns.getServerMoneyAvailable("home");
	const servers = ns.getPurchasedServers(true);
	const isFull = servers.length == ns.getPurchasedServerLimit();
	const serversToUpgrade = isFull ? getLowestServers(ns, servers, requestedRam) : [];
	if (isFull && serversToUpgrade.length == 0) {
		requestedRam *= 2;
		return;
	}
	if (serverCost < money) {
		if (serversToUpgrade.length > 0) {
			ns.killall(serversToUpgrade[0]);
			await ns.sleep(100);
			ns.deleteServer(serversToUpgrade[0]);
			return;
		}
		ns.purchaseServer("hacker", requestedRam);
	}
}

async function buildServerGraph(ns) {
	const servers = ns.read("servers.txt").split("\n").filter((item) => {
		return item.length > 1 && item.indexOf("hack") == -1 && item != "home";
	});
	const results = {};
	for (const server of servers) {
		const serverDetails = ns.getServer(server);
		if (!serverDetails.hasAdminRights) {
			continue;
		}
		results[server] = serverDetails;
	}
	return results;
}

async function readMessages(ns) {
	while(true) {
		const message = await ns.readPort(READ_PORT);
		ns.print("Received: " + message);
		if (message.indexOf("PORT") != -1) {
			break;
		}
		const messageParts = message.split(' ');
		const target = messageParts[0];
		const method = messageParts[1];
		servers[target][method] = false;
	}
}

async function isServerBusy(ns, server) {
	return server[GROW] || server[WEAKEN] || server[HACK];
}

async function getNextMethod(ns, serverName, server) {
	if(Math.abs(ns.getServerMinSecurityLevel(serverName) - ns.getServerSecurityLevel(serverName)) > 5) {
		return WEAKEN;
	}
	if (ns.getServerMoneyAvailable(serverName) > ns.getServerMaxMoney(serverName) * 0.5) {
		return HACK;
	}
	return GROW;
} 

async function sendCommands(ns) {
	for (const serverName in servers) {
		const server = servers[serverName];
		if (await isServerBusy(ns, server)) {
			continue;
		}
		const method = await getNextMethod(ns, serverName, server);
		if(!await sendMessage(ns, serverName, method)) {
			break;
		}
		server[method] = true;
	}
}

export async function main(ns) {
	requestedRam = await getStartingRam(ns);
	servers = await buildServerGraph(ns);
	ns.print(servers);
	ns.clearPort(WRITE_PORT);
	ns.clearPort(READ_PORT);
	while (true) {
		await start(ns);
		await handleServerUpgrades(ns);
		await readMessages(ns);
		await sendCommands(ns);
		await ns.sleep(10000);
	}
}