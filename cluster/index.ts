import * as pulumi from "@pulumi/pulumi";
import * as rke from "@jaxxstorm/pulumi-rke";

// Get the config from the stack
let config = new pulumi.Config()

// Cluster name is configurable
export const clusterName = config.require("name")

// Define an interface to read the node config
// We want the nodes to be configurable
interface Nodes {
    [index: number]: {
        address: string;
        roles: string[];
        user: string;
    }
}

interface Sans {
    [index: number]: {
        addresses: string[];
    }
}

// Grab the node config
let nodes = config.requireObject<Nodes>("nodes");

let sans = config.requireObject<Sans>("sans");


// Create an RKE cluster!
const cluster = new rke.Cluster(clusterName, {
    clusterName: clusterName,
    ignoreDockerVersion: false,
    sshAgentAuth: true,
    nodes: nodes as any[], // cast the interface to an array
    network: {
        plugin: 'calico',
    },
    authentication: {
        sans: sans as any[],
    },
    services: {
        kubelet: {
            extraBinds: [
                "/mnt:/mnt"
            ],
        },
    },
    ingress: { provider: "none" },
});

// export the kubeconfig for the cluster
export const kubeConfig = cluster.kubeConfigYaml

