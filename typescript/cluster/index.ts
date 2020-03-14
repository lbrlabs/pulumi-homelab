import * as pulumi from "@pulumi/pulumi";
import * as rke from "@jaxxstorm/pulumi-rke";
import * as k8s from "@pulumi/kubernetes";

// Get the config from the stack
let config = new pulumi.Config()

// Cluster name is configurable
export const clusterName = config.require("name")
const metallbChartVersion = config.require("metallbChartVersion")
const address = config.require("metallbAddresses")

// Define an interface to read the node config
// We want the nodes to be configurable
interface Nodes {
    [index: number]: {
        address: string;
        roles: string[];
        user: string;
    }
}

// Grab the node config
let nodes = config.requireObject<Nodes>("nodes");


// Create an RKE cluster!
const cluster = new rke.Cluster(clusterName, {
    clusterName: clusterName,
    ignoreDockerVersion: false,
    sshAgentAuth: true,
    nodes: nodes as any[], // cast the interface to an array
    ingress: { provider: "none" },
});

// export the kubeconfig for the cluster
export const kubeconfig = cluster.kubeConfigYaml


// Set up metallb
const provider = new k8s.Provider(clusterName, { kubeconfig });

const addressConfig = {
    "address-pools": [
        { "name": "default", protocol: "layer2", addresses: ["192.168.1.240-192.168.1.250"] }
    ]
}

const metallbConfig = new k8s.core.v1.ConfigMap("metallb-config", {
    metadata: { namespace: "kube-system" },
    data: {
        "config": JSON.stringify(addressConfig)
    },
});
const metallbConfigName = metallbConfig.metadata.apply(m => m.name);

const metallb = new k8s.helm.v2.Chart("metallb",
    {
        namespace: "kube-system",
        chart: "metallb",
        version: metallbChartVersion,
        fetchOpts: { repo: "https://kubernetes-charts.storage.googleapis.com/" },
        values: { existingConfigMap: metallbConfigName },
    },
    { providers: { kubernetes: provider } },
);

// set up nginx-ingress

const nginx = new k8s.helm.v2.Chart("nginx-ingress",
    {
        namespace: "kube-system",
        chart: "nginx-ingress",
        version: "1.33.5",
        fetchOpts: { repo: "https://kubernetes-charts.storage.googleapis.com/" },
        values: {
            stats: {
                enabled: true,
            },
            service: {
                type: "LoadBalancer",
            },
            publishService: {
                enabled: true,
            },
            metrics: {
                enabled: true,
            },
            extraArgs: {
                "sort-backends": true,
            }
        }
    },
    { providers: { kubernetes: provider } },
)




