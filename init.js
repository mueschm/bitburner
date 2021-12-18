/** @param {NS} ns **/
const portBreakers = ['BruteSSH.exe', 'FTPCrack.exe', 'relaySMTP.exe', 'HTTPWorm.exe', 'SQLInject.exe'];

async function getCurrentPortLevel(ns) {
	let count = 0;
	for (const breaker of portBreakers) {
		if (ns.fileExists(breaker, "home")) {
			count++;
		} else {
			break;
		}
	}
	return count;
}

async function runPortBreakers(ns, target, count) {
	const breakers = [ns.brutessh, ns.ftpcrack, ns.relaysmtp, ns.httpworm, ns.sqlinject];
	for (let i = 0;i < count;i++) {
		breakers[i](target);
	}
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

export async function main(ns) {
	await ns.write("servers.txt", "", "w");
	const hostName = ns.getHostname();
	const weakenThreshold = ns.args[1] || 10;
	let hosts = ns.scan(hostName, true);
	const target = ns.args[0] || serverName;
	const currentPortLevel = await getCurrentPortLevel(ns);
	const currentHackingLevel = ns.getHackingLevel();
	const ramUsageHack = ns.getScriptRam("hack.js", "home");
	const processedServers = [];
	ns.print(hosts);
	while (hosts.length > 0) {
		const serverName = hosts.pop();
		await ns.write("servers.txt", serverName + "\n", "a");
		processedServers.push(serverName);
		hosts = hosts.concat(ns.scan(serverName)).filter((item) => {
			return processedServers.indexOf(item) == -1;
		});
		if (serverName.indexOf("hacker") != -1) {
			continue;
		}
		ns.print("Hacking server: " + serverName);
		if (serverName == hostName) {
			continue;
		}
		const isHackRunning = await isProcessRunning(ns, "hack.js", serverName);
		if (isHackRunning) {
			ns.print("Already running");
			continue;
		}
		const server = ns.getServer(serverName);
		const hackingSkillRequired = server.requiredHackingSkill;
		const numPortsRequired = server.numOpenPortsRequired;
		if (hackingSkillRequired > currentHackingLevel) {
			continue;
		}
		if (numPortsRequired > currentPortLevel) {
			continue;
		}
		await runPortBreakers(ns, serverName, currentPortLevel);
		ns.nuke(serverName);
		await ns.scp("hack.js", serverName);
		const maxRam = ns.getServerMaxRam(serverName);
		const threadsHack = Math.floor((maxRam - ns.getServerUsedRam(serverName)) / ramUsageHack) || 1;
		ns.exec("hack.js", serverName, threadsHack, target, threadsHack, weakenThreshold);
		await ns.sleep(100);
	}

	await ns.sleep(10000000);
}