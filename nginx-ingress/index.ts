import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

// Get the config from the stack
let config = new pulumi.Config()

const stack = pulumi.getStack()
const stackRef = `jaxxstorm/cluster/${stack}`;

// Get stack references
const cluster = new pulumi.StackReference(stackRef); // # FIXME: make configurable
const provider = new k8s.Provider("k8s", { kubeconfig: cluster.getOutput("kubeConfig") });

// Configuration options
const ns = config.require("namespace")

const namespace = new k8s.core.v1.Namespace("ns", {
    metadata: {
        name: ns,
    }
}, { provider: provider });

// set up nginx-ingress
const nginx = new k8s.helm.v2.Chart("nginx-ingress",
    {
        namespace: namespace.metadata.name,
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
