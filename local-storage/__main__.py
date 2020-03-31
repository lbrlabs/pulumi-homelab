import pulumi
import pulumi_kubernetes as k8s
import pulumi_kubernetes.helm.v3 as helm
from pulumi_kubernetes.core.v1 import Namespace
from pulumi_kubernetes.storage.v1 import StorageClass

# Get the stack
stack = pulumi.get_stack()
sr = "jaxxstorm/cluster/{}".format(stack)
stack_ref = pulumi.StackReference(sr)
# Get the kubeconfig from the stack
kubeconfig = stack_ref.get_output("kubeConfig")

# Get configuration options
config = pulumi.Config()
namespace = config.require("namespace")

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
    ), pulumi.ResourceOptions(provider=provider) 
)

sc = StorageClass("local", 
    metadata={
        "name": "local",
    },
    opts=pulumi.ResourceOptions(provider=provider),
    provisioner="kubernetes.io/no-provisioner",
    volume_binding_mode="WaitForFirstConsumer",
    reclaim_policy="Delete",
)


