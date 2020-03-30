from pulumi import StackReference
from pulumi_kubernetes.helm.v3 import Chart, ChartOpts, LocalChartOpts
from pulumi_kubernetes.provider import Provider
from pulumi_kubernetes.core.v1 import PersistentVolume, PersistentVolumeList, Namespace
from pulumi_kubernetes.yaml import ConfigFile


stack = StackReference("jaxxstorm/homelab-cluster/homelab")

kubeconfig = stack.get_output("kubeconfig")
# clusterName = stack.get_output("clusterName")


provider = Provider(
    "home.lbrlabs",
    kubeconfig=kubeconfig
)

Chart("local-volume-provisioner", LocalChartOpts(
    path="charts/provisioner",
    namespace="kube-system",
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

ConfigFile("rook-nfs-operator",
           "https://raw.githubusercontent.com/rook/rook/master/cluster/examples/kubernetes/nfs/operator.yaml")


def set_pvc_rwo(obj):
    if obj['kind'] == "PersistentVolumeClaim" and obj['spec']['accessModes'][0] == "ReadWriteMany":
        obj['spec']['accessModes'][0] = "ReadWriteOnce"

def set_volume(obj):
    if obj['kind'] == "PersistentVolumeClaim":
        obj['spec']['volumeName'] = pv # FIXME: make this configurable

def set_volume_size(obj):
    if obj['kind'] == "PersistentVolumeClaim":
        obj['spec']['resources']['requests']['storage'] = '200Gi'


ConfigFile("rook-nfs-server",
           "https://raw.githubusercontent.com/rook/rook/master/cluster/examples/kubernetes/nfs/nfs.yaml",
           transformations=[set_pvc_rwo,set_volume_size])
