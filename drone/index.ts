import * as k8s from "@pulumi/kubernetes";
import * as pulumi from "@pulumi/pulumi";

// Get the config from the stack
let config = new pulumi.Config()
const stack = pulumi.getStack()
const stackRef = `jaxxstorm/cluster/${stack}`;

// Get stack references
const cluster = new pulumi.StackReference(stackRef); // # FIXME: make configurable
const provider = new k8s.Provider("k8s", { kubeconfig: cluster.getOutput("kubeConfig") });

// Set configuration values
const ns = config.require("namespace")
const rpcSecret = config.require("rpcSecret")
const hostUri = config.require("hostUri")
const httpProtocol = config.get("httpProtocol") || "https";

const namespace = new k8s.core.v1.Namespace("ns", {
    metadata: {
        name: ns,
    }
}, { provider: provider });

const droneRunner = new k8s.helm.v2.Chart("drone-runner",
     {
        namespace: namespace.metadata.name,
        chart: "drone-runner-kube",
        version: "0.1.2",
        fetchOpts: { repo: "https://charts.drone.io" },
        values: {
            env: {
                DRONE_RPC_SECRET: rpcSecret,
                DRONE_RPC_HOST: hostUri,
                DRONE_RPC_PROTO: httpProtocol,
                DRONE_NAMESPACE_DEFAULT: namespace.metadata.name,
                DRONE_RPC_SKIP_VERIFY: true,
            }
        }
     },
     { providers: { kubernetes: provider } },
 );


