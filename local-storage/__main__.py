import pulumi
import pulumi_kubernetes as k8s
import pulumi_kubernetes.helm.v3 as helm
from pulumi_kubernetes.core.v1 import Namespace

# Get the stack
stack = pulumi.StackReference("jaxxstorm/cluster/homelab")
# Get the kubeconfig from the stack
kubeconfig = stack.get_output("kubeConfig")

# Get configuration options
config = pulumi.Config()
namespace = config.get("namespace")

# Set up the provider
provider = k8s.Provider(
    "home.lbrlabs",
    kubeconfig=kubeconfig
)

# Create the namespace
ns = Namespace("ns", metadata={
    "name": "local-storage",
})

# Install the helm chart
helm.Chart("local-volume-provisioner", helm.LocalChartOpts(
    path="charts/provisioner",
    namespace=ns.metadata["name"],
    values={
        "classes": [
            {
                "name": 'local',
                "hostDir": "/mnt/",
                "mountDir": "/mnt/k8s",
                "volumeMode": "Filesystem",
                "fsType": "ext4",
            }
        ]
    }
))

