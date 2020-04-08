using Pulumi;
using Pulumi.Kubernetes;
using Pulumi.Kubernetes.Core.V1;
using Pulumi.Kubernetes.Helm;
using Pulumi.Kubernetes.Helm.V2;



class CertManager : Stack
{
    public CertManager()
    {
        // Get the stackref and the output
        var stackRef = new StackReference("jaxxstorm/cluster/homelab");
        var kubeConfig = stackRef.GetOutput("kubeConfig");


        // Get the configuration options
        var config = new Config();
        var configNs = config.Require("namespace");

        // Set up the provider
        
        var provider = new Provider("home.lbrlabs", new ProviderArgs{
                KubeConfig = kubeConfig.ToString(),
            }
        );
        

        var ns = new Namespace(configNs, null, new CustomResourceOptions{
            Provider=provider
        });
        var namespaceName = ns.Metadata.Apply(n => n.Name);

        var chart = new Chart("cert-manager", new ChartArgs
        {
            Chart="cert-manager",
            Namespace=namespaceName,
            FetchOptions = new ChartFetchArgs{
                Repo = "https://charts.jetstack.io"
            }
        }, new ComponentResourceOptions{ Provider=provider }
        );
        



    }

    [Output]
    public Output<string> Name { get; set; }
}
