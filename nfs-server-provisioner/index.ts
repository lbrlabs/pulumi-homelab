import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

import * as kx from "@pulumi/kubernetesx";

// Get the config from the stack
let config = new pulumi.Config()
const stack = pulumi.getStack()

const stackRef = `jaxxstorm/cluster/${stack}`;

// Get stack references
const cluster = new pulumi.StackReference(stackRef); // # FIXME: make configurable
const provider = new k8s.Provider("k8s", { kubeconfig: cluster.getOutput("kubeConfig") });

const ns = config.require("namespace")

const namespace = new k8s.core.v1.Namespace("ns", {
    metadata: {
        name: ns,
    }
}, { provider: provider });

const nfs = new k8s.helm.v2.Chart("nfs",
     {
         namespace: namespace.metadata.name,
         chart: "nfs-server-provisioner",
         version: "1.0.0",
         fetchOpts: { repo: "https://kubernetes-charts.storage.googleapis.com/" },
         values: {
             persistence: {
                enabled: true,
                size: "300Gi",
                storageClass: "local",
             },
             storageClass: {
                 defaultClass: true,
             }
         },
     },
     { providers: { kubernetes: provider } },
 );

