const { execSync } = require("child_process");
const path = require("path");

const buildBackend = () => {
  console.log("Installing AGS Evidence Store Solution dependencies");
  execSync("yarn install --frozen-lockfile", {
    stdio: "inherit",
  });

  console.log("Building AGSEvidenceStore Application");
  execSync("yarn run all", {
    cwd: path.resolve(__dirname, "./AGSEvidenceStore/app/lambda"),
    stdio: "inherit",
  });

  console.log("Building AGSEvidenceStore Infra");
  execSync("yarn run build", {
    cwd: path.resolve(__dirname, "./AGSEvidenceStore/infra"),
    stdio: "inherit",
  });

  console.log("Building AGSSecurityHubEvidenceCollector Application");
  execSync("yarn run all", {
    cwd: path.resolve(__dirname, "./AGSSecurityHubEvidenceCollector/app/lambda"),
    stdio: "inherit",
  });

  console.log("Building AGSSecurityHubEvidenceCollector Infra");
  execSync("yarn run build", {
    cwd: path.resolve(__dirname, "./AGSSecurityHubEvidenceCollector/infra"),
    stdio: "inherit",
  });

  console.log("Building AGSSharedInfra");
  execSync("yarn run all", {
    cwd: path.resolve(__dirname, "./AGSSharedInfra/infra"),
    stdio: "inherit",
  });
};

const buildWebClient = () => {
  console.log("Installing AGSWebClient dependencies");
  execSync("yarn install --frozen-lockfile", {
    cwd: path.resolve(__dirname, "./AGSWebClient"),
    stdio: "inherit",
  });

  console.log("Building AGSWebClient");
  execSync("yarn workspace @ags/webclient-app build", {
    cwd: path.resolve(__dirname, "./AGSWebClient"),
    env: { ...process.env, SKIP_PREFLIGHT_CHECK: true },
    stdio: "inherit",
  });
};

const synthSharedInfra = (configName, envName) => {
  console.log("Synthesise AGSSharedInfra");
  execSync(`yarn run synth -c personal=off -c configName=${configName} -c envName=${envName}`, {
    cwd: path.resolve(__dirname, "./AGSSharedInfra/infra"),
    stdio: "inherit",
  });
};

const synthServices = (configName, envName, serviceName) => {
  switch (serviceName) {
    case "AGSEvidenceStore":
      console.log("Synthesise AGSEvidenceStore");
      execSync(`yarn run synth -c personal=off -c configName=${configName} -c envName=${envName}`, {
        cwd: path.resolve(__dirname, "./AGSEvidenceStore/infra"),
        stdio: "inherit",
      });
      break;
    case "AGSSecurityHubEvidenceCollector":
      console.log("Synthesise AGSSecurityHubEvidenceCollector");
      execSync(`yarn run synth -c personal=off -c configName=${configName} -c envName=${envName}`, {
        cwd: path.resolve(__dirname, "./AGSSecurityHubEvidenceCollector/infra"),
        stdio: "inherit",
      });
      break;
  }
};

module.exports = {
  buildBackend,
  buildWebClient,
  synthSharedInfra,
  synthServices,
};
