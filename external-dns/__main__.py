import pulumi
import pulumi_kubernetes as k8s
import pulumi_kubernetes.helm.v3 as helm
from pulumi_kubernetes.core.v1 import Namespace

# Get the outputs from the current stack
# We assume here we always want the reference from the stack we're in
stack = pulumi.get_stack()
sr = "jaxxstorm/cluster/{}".format(stack)
stack_ref = pulumi.StackReference(sr)
# Get the kubeconfig from the stack
kubeconfig = stack_ref.get_output("kubeConfig")

# Get configuration options
config = pulumi.Config()
namespace = config.require("namespace")
api_token = config.require_secret("api_token")

# Set up the provider
provider = k8s.Provider(
    "home.lbrlabs",
    kubeconfig=kubeconfig
)

# Create the namespace
ns = Namespace("ns", metadata={
    "name": namespace,
    },
    opts=pulumi.ResourceOptions(provider=provider),

)

# Install the helm chart
helm.Chart("external-dns", helm.LocalChartOpts(
    path="charts/external-dns",
    namespace=ns.metadata["name"],
    values={
        "provider": "cloudflare",
        "cloudflare": {
            "apiToken": api_token,
        },
        "txtOwnerId": "home.lbrlabs",
    },
    ), pulumi.ResourceOptions(provider=provider) 
)



