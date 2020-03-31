from pulumi import StackReference
from pulumi_kubernetes.helm.v3 import Chart, ChartOpts, LocalChartOpts
from pulumi_kubernetes.provider import Provider
from pulumi_kubernetes.core.v1 import PersistentVolume, PersistentVolumeList, Namespace
from pulumi_kubernetes.yaml import ConfigFile


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
