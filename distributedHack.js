/** @param {NS} ns **/
const READ_PORT = 2;
const WRITE_PORT = 1;
let nsGlobal;
let target = "";
let method = "";

async function onExit() {
	if (target && method) {
		await nsGlobal.writePort(WRITE_PORT, target + " " + method);
	}
}

export async function main(ns) {
	nsGlobal = ns;
	ns.atExit(onExit)
	const threads = ns.args[0] || 1;
	// await ns.writePort(11, ns.getHostname() + " threads " + threads);
	while(true) {
		const message = ns.readPort(READ_PORT);
		if (message.indexOf("PORT") != -1) {
			await ns.sleep(10000);
			continue;
		}
		const messageParts = message.split(" ");
		ns.print(message);
		target = messageParts[0];
		method = messageParts[1];
		if (method == "weaken") {
			await ns.weaken(target);
		} else if(method == "grow") {
			await ns.grow(target);
		} else if (method == "hack") {
			await ns.hack(target);
		}
		await ns.writePort(WRITE_PORT, target + " " + method);
		target = "";
		method = "";
		await ns.sleep(1000);
	}
}