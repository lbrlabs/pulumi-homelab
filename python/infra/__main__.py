from pulumi import StackReference
from pulumi_kubernetes.helm.v3 import Chart, ChartOpts
from pulumi_kubernetes.provider import Provider


stack = StackReference("jaxxstorm/homelab-cluster/homelab")

kubeconfig = stack.get_output("kubeconfig")
# clusterName = stack.get_output("clusterName")


provider = Provider(
    "home.lbrlabs",
    kubeconfig=kubeconfig
)


Chart("nfs-server-provisioner", ChartOpts(
    "stable/nfs-server-provisioner",
    namespace="kube-system",
    values={
        "nodeSelector":
        {
            "kubernetes.io/hostname": "jupiter.home.lbrlabs.com"
        }
    }
)
)
