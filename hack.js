/** @param {NS} ns **/
async function weakenServer(ns, serverName, threads, weaknessThreshold) {
	while (ns.getServerSecurityLevel(serverName) > weaknessThreshold) {
		await ns.weaken(serverName, {threads: threads});
	}
}

async function hackServer(ns, serverName, threads, weaknessThreshold) {
	while (true) {
		await weakenServer(ns, serverName, threads, weaknessThreshold)
		const maxMoney = ns.getServerMaxMoney(serverName);
		let availableCash = ns.getServerMoneyAvailable(serverName);
		if (availableCash < maxMoney * 0.20) {
			await ns.grow(serverName);
		} else {
			await ns.hack(serverName);
		}
		await ns.sleep(1);
	}
}

export async function main(ns) {
	const serverName = ns.args[0];
	const threads = ns.args[1] || 1;
	let weaknessThreshold = ns.args[2] || 10;
	const minSecurityLevel = ns.getServerMinSecurityLevel(serverName);
	if (weaknessThreshold < minSecurityLevel) {
		weaknessThreshold = minSecurityLevel + 1;
	}
	await hackServer(ns, serverName, threads, weaknessThreshold);
}