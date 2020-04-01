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
const uri = config.require("uri")
const clientID = config.require("clientID")
const clientSecret = config.require("clientSecret")
const auth0Domain = config.require("auth0Domain")
const argocdAdminEmail = config.require("argocdAdminEmail")

// We grab the configfile at a specific commit because we don't want the
// CRD to change until the helm chart does
const app = new k8s.yaml.ConfigFile("https://raw.githubusercontent.com/argoproj/argo-helm/bad9aff0aa4d31b7ecb9ac2c856a242500840c3e/charts/argo-cd/crds/crd-application.yaml")
const proj = new k8s.yaml.ConfigFile("https://raw.githubusercontent.com/argoproj/argo-helm/bad9aff0aa4d31b7ecb9ac2c856a242500840c3e/charts/argo-cd/crds/crd-project.yaml")

const namespace = new k8s.core.v1.Namespace("ns", {
    metadata: {
        name: ns,
    }
}, { provider: provider });

// oidc config
const oidcConfig = {
    name: "Auth0",
    issuer: `https://${auth0Domain}/`,
    clientID: clientID, // FIXME: Set this to a secret
    clientSecret: clientSecret, // FIXME: Set this to a secret
    requestedScopes: [ "openid", "profile", "email", `http://${auth0Domain}/groups` ]
}

const metallb = new k8s.helm.v2.Chart("metallb",
     {
         namespace: namespace.metadata.name,
         chart: "argo-cd",
         fetchOpts: { repo: "https://argoproj.github.io/argo-helm" },
         values: {  
            installCRDs: false,
            dex: {
                enabled: false,
            },
            server: {
                config: {
                    url: `https://${uri}`,
                    "oidc.config": JSON.stringify(oidcConfig),
                },
               service: {
                   type: 'LoadBalancer',
                   annotations: {
                    "external-dns.alpha.kubernetes.io/hostname": uri,
                   },
               },
               rbacConfig: {
                   scopes: `[ http://${auth0Domain}/groups, email ]`,
                   "policy.csv": `g, ${argocdAdminEmail}, role:admin`
               }
            }
         },
         // The helm chart is using a deprecated apiVersion,
         // So let's transform it
         transformations: [
            (obj: any) => {
                if (obj.apiVersion == "extensions/v1beta1")  {
                    obj.apiVersion = "networking.k8s.io/v1beta1"
                }
            },
         ],
     },
     { providers: { kubernetes: provider }, dependsOn: [app, proj, namespace] },
 );