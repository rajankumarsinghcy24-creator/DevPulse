const { spawn } = require("child_process");
const path = require("path");

const runScript = (scriptName) => {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ Running ${scriptName}...`);
    const proc = spawn("node", [path.join(__dirname, scriptName)], {
      stdio: "inherit"
    });

    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${scriptName} failed with exit code ${code}`));
      }
    });
  });
};

const runAll = async () => {
  try {
    await runScript("testAuth.js");
    await runScript("testProjects.js");
    await runScript("testTasks.js");
    await runScript("testDashboard.js");
    await runScript("testAI.js");
    console.log("\n🎉 ALL TEST SUITES PASSED SUCCESSFULLY!");
    process.exit(0);
  } catch (err) {
    console.error(`\n❌ Test Suite Failure: ${err.message}`);
    process.exit(1);
  }
};

runAll();
