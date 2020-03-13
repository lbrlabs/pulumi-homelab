import * as pulumi from "@pulumi/pulumi";
import * as rke from "@jaxxstorm/pulumi-rke";

// Get the config from the stack
let config = new pulumi.Config()

// Cluster name is configurable
const clusterName = config.require("name")

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
    ignoreDockerVersion: false,
    sshAgentAuth: true,
    nodes: nodes as any[], // cast the interface to an array
});

// export the kubeconfig for the cluster
export const kubeconfig = cluster.kubeConfigYaml



