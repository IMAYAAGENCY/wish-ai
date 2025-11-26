import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Key, Save, Loader2, CheckCircle2, XCircle, TestTube, Download, Upload } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { encryptCredentials, decryptCredentials } from "@/lib/credentialsEncryption";
import { PasswordStrengthDialog } from "@/components/PasswordStrengthDialog";
import { ImportConfirmationDialog } from "@/components/ImportConfirmationDialog";
import type { AffiliatePlatform } from "@/types/affiliate";

interface PlatformConfig {
  platform: AffiliatePlatform;
  label: string;
  fields: { key: string; label: string; type?: string }[];
}

const platforms: PlatformConfig[] = [
  {
    platform: 'amazon',
    label: 'Amazon Associates',
    fields: [
      { key: 'accessKey', label: 'Access Key' },
      { key: 'secretKey', label: 'Secret Key', type: 'password' },
      { key: 'partnerTag', label: 'Partner Tag' }
    ]
  },
  {
    platform: 'admitad',
    label: 'Admitad',
    fields: [
      { key: 'clientId', label: 'Client ID' },
      { key: 'clientSecret', label: 'Client Secret', type: 'password' }
    ]
  },
  {
    platform: 'clickbank',
    label: 'ClickBank',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'accountNickname', label: 'Account Nickname' }
    ]
  },
  {
    platform: 'shareasale',
    label: 'ShareASale',
    fields: [
      { key: 'apiToken', label: 'API Token', type: 'password' },
      { key: 'apiSecret', label: 'API Secret', type: 'password' },
      { key: 'affiliateId', label: 'Affiliate ID' }
    ]
  },
  {
    platform: 'cj',
    label: 'CJ Affiliate',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'websiteId', label: 'Website ID' }
    ]
  },
  {
    platform: 'impact',
    label: 'Impact',
    fields: [
      { key: 'accountSid', label: 'Account SID' },
      { key: 'authToken', label: 'Auth Token', type: 'password' }
    ]
  },
  {
    platform: 'rakuten',
    label: 'Rakuten Advertising',
    fields: [
      { key: 'apiKey', label: 'API Key', type: 'password' },
      { key: 'siteId', label: 'Site ID' }
    ]
  }
];

export const AffiliateCredentialsForm = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<Record<string, any>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingExportData, setPendingExportData] = useState<any>(null);
  const [showImportConfirmation, setShowImportConfirmation] = useState(false);
  const [pendingImportData, setPendingImportData] = useState<any>(null);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('affiliate_credentials')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const credMap: Record<string, any> = {};
      data?.forEach(item => {
        const creds = item.credentials as Record<string, any> || {};
        credMap[item.platform] = {
          ...creds,
          is_active: item.is_active
        };
      });
      setCredentials(credMap);
    } catch (error) {
      console.error('Error fetching credentials:', error);
    }
  };

  const handleSave = async (platform: AffiliatePlatform, values: Record<string, string>, isActive: boolean) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('affiliate_credentials')
        .upsert({
          user_id: user.id,
          platform,
          credentials: values as Record<string, any>,
          is_active: isActive
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${platform} credentials saved successfully.`
      });

      await fetchCredentials();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('affiliate_credentials')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No credentials",
          description: "You don't have any credentials to export.",
          variant: "destructive"
        });
        setIsExporting(false);
        return;
      }

      // Store data and show password dialog
      setPendingExportData(data);
      setShowPasswordDialog(true);
      setIsExporting(false);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
      setIsExporting(false);
    }
  };

  const handlePasswordConfirm = async (password: string) => {
    setIsExporting(true);
    try {
      // Encrypt credentials
      const encryptedData = await encryptCredentials(pendingExportData, password);
      
      const exportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        data: encryptedData
      };

      // Download as JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affiliate-credentials-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Export successful",
        description: "Your credentials have been encrypted and downloaded."
      });

      setPendingExportData(null);
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          setIsImporting(false);
          return;
        }

        try {
          const text = await file.text();
          const importData = JSON.parse(text);

          if (!importData.version || !importData.data) {
            throw new Error('Invalid backup file format');
          }

          // Ask for decryption password
          const password = window.prompt('Enter the password to decrypt your credentials backup:');
          
          if (!password) {
            toast({
              title: "Import cancelled",
              description: "Password is required to import credentials."
            });
            setIsImporting(false);
            return;
          }

          // Decrypt credentials
          const decryptedData = await decryptCredentials(importData.data, password);

          // Store decrypted data and show confirmation dialog
          setPendingImportData(decryptedData);
          setShowImportConfirmation(true);
          setIsImporting(false);
        } catch (error: any) {
          toast({
            title: "Import failed",
            description: error.message,
            variant: "destructive"
          });
          setIsImporting(false);
        }
      };

      input.click();
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
      setIsImporting(false);
    }
  };

  const handleImportConfirm = async () => {
    setIsImporting(true);
    setShowImportConfirmation(false);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Import each credential
      let successCount = 0;
      let errorCount = 0;

      for (const cred of pendingImportData) {
        const { error } = await supabase
          .from('affiliate_credentials')
          .upsert({
            user_id: user.id,
            platform: cred.platform,
            credentials: cred.credentials,
            is_active: cred.is_active
          }, {
            onConflict: 'user_id,platform'
          });

        if (error) {
          errorCount++;
          console.error(`Failed to import ${cred.platform}:`, error);
        } else {
          successCount++;
        }
      }

      await fetchCredentials();

      toast({
        title: "Import completed",
        description: `Successfully imported ${successCount} credential(s). ${errorCount > 0 ? `Failed: ${errorCount}` : ''}`
      });

      setPendingImportData(null);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const existingPlatforms = Object.keys(credentials);
  const platformsToImport = pendingImportData?.map((cred: any) => cred.platform) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Affiliate Platform Credentials</CardTitle>
                <CardDescription>
                  Securely store your API credentials for each affiliate platform
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting || isImporting}
              >
                {isExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleImport}
                disabled={isExporting || isImporting}
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={platforms[0].platform} className="w-full">
            <TabsList className="grid grid-cols-3 lg:grid-cols-7 w-full">
              {platforms.map(p => (
                <TabsTrigger key={p.platform} value={p.platform}>
                  {p.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {platforms.map(platformConfig => (
              <TabsContent key={platformConfig.platform} value={platformConfig.platform}>
                <PlatformForm
                  config={platformConfig}
                  initialValues={credentials[platformConfig.platform] || {}}
                  onSave={handleSave}
                  loading={loading}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <PasswordStrengthDialog
        open={showPasswordDialog}
        onOpenChange={setShowPasswordDialog}
        onConfirm={handlePasswordConfirm}
        title="Set Encryption Password"
        description="Create a strong password to encrypt your credentials backup. You will need this password to restore your credentials."
      />

      <ImportConfirmationDialog
        open={showImportConfirmation}
        onOpenChange={setShowImportConfirmation}
        onConfirm={handleImportConfirm}
        platformsToImport={platformsToImport}
        existingPlatforms={existingPlatforms}
      />
    </>
  );
};

interface TestResult {
  success: boolean;
  message: string;
}

interface PlatformFormProps {
  config: PlatformConfig;
  initialValues: Record<string, any>;
  onSave: (platform: AffiliatePlatform, values: Record<string, string>, isActive: boolean) => Promise<void>;
  loading: boolean;
}

const PlatformForm = ({ config, initialValues, onSave, loading }: PlatformFormProps) => {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const fieldValues: Record<string, string> = {};
    config.fields.forEach(field => {
      fieldValues[field.key] = initialValues[field.key] || '';
    });
    setValues(fieldValues);
    setIsActive(initialValues.is_active ?? false);
  }, [initialValues, config.fields]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config.platform, values, isActive);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('test-affiliate-credentials', {
        body: { platform: config.platform },
      });

      if (error) throw error;

      setTestResult(data);
      
      toast({
        title: data.success ? "Test Successful" : "Test Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    } catch (error: any) {
      const result = {
        success: false,
        message: error.message
      };
      setTestResult(result);
      
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
        <div>
          <Label className="text-base font-medium">Enable {config.label}</Label>
          <p className="text-sm text-muted-foreground">
            Activate this platform for product searches
          </p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={setIsActive}
        />
      </div>

      <div className="space-y-3">
        {config.fields.map(field => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={`${config.platform}-${field.key}`}>
              {field.label}
            </Label>
            <Input
              id={`${config.platform}-${field.key}`}
              type={field.type || 'text'}
              value={values[field.key] || ''}
              onChange={(e) => setValues({ ...values, [field.key]: e.target.value })}
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        ))}
      </div>

      {testResult && (
        <Alert variant={testResult.success ? "default" : "destructive"}>
          <div className="flex items-start gap-2">
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive mt-0.5" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleTest}
          disabled={testing || loading}
          className="flex-1"
        >
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            <>
              <TestTube className="mr-2 h-4 w-4" />
              Test Credentials
            </>
          )}
        </Button>

        <Button type="submit" disabled={loading || testing} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save {config.label} Credentials
            </>
          )}
        </Button>
      </div>
    </form>
  );
};
