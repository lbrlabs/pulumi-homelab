import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import * as kx from "@pulumi/kubernetesx";

// Get the config from the stack
let config = new pulumi.Config()

// Get stack references
const cluster = new pulumi.StackReference("jaxxstorm/cluster/homelab"); // # FIXME: make configurable
const provider = new k8s.Provider("k8s", { kubeconfig: cluster.getOutput("kubeConfig") });

// Set configuration values
const metallbChartVersion = config.require("chartVersion")
const address = config.require("metallbAddresses")
const ns = config.require("namespace")

const namespace = new k8s.core.v1.Namespace("ns", {
    metadata: {
        name: ns,
    }
}, { provider: provider });

const addressConfig = {
    "address-pools": [
        { "name": "default", protocol: "layer2", addresses: ["192.168.1.240-192.168.1.250"] }
    ]
}

const metallbConfig = new k8s.core.v1.ConfigMap("metallb-config", {
    metadata: { namespace: namespace.metadata.name },
    data: {
        "config": JSON.stringify(addressConfig)
    },
});
const metallbConfigName = metallbConfig.metadata.apply(m => m.name);

const metallb = new k8s.helm.v2.Chart("metallb",
     {
         namespace: namespace.metadata.name,
         chart: "metallb",
         version: metallbChartVersion,
         fetchOpts: { repo: "https://kubernetes-charts.storage.googleapis.com/" },
         values: { existingConfigMap: metallbConfigName },
     },
     { providers: { kubernetes: provider } },
 );

