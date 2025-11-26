import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, FileDown, RefreshCw } from "lucide-react";

interface ImportConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  platformsToImport: string[];
  existingPlatforms: string[];
}

export function ImportConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  platformsToImport,
  existingPlatforms,
}: ImportConfirmationDialogProps) {
  const platformsToOverwrite = platformsToImport.filter((p) =>
    existingPlatforms.includes(p)
  );
  const newPlatforms = platformsToImport.filter(
    (p) => !existingPlatforms.includes(p)
  );

  const formatPlatformName = (platform: string): string => {
    const platformNames: Record<string, string> = {
      amazon: "Amazon Associates",
      admitad: "Admitad",
      clickbank: "ClickBank",
      shareasale: "ShareASale",
      cj: "CJ Affiliate",
      impact: "Impact",
      rakuten: "Rakuten Advertising",
    };
    return platformNames[platform] || platform;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Confirm Credentials Import
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            You are about to import credentials for{" "}
            <span className="font-semibold">{platformsToImport.length}</span>{" "}
            platform{platformsToImport.length !== 1 ? "s" : ""}.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {platformsToOverwrite.length > 0 && (
            <Alert variant="destructive">
              <RefreshCw className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">
                  Warning: The following platforms will be overwritten:
                </p>
                <div className="flex flex-wrap gap-2">
                  {platformsToOverwrite.map((platform) => (
                    <Badge key={platform} variant="destructive">
                      {formatPlatformName(platform)}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2 text-sm">
                  Your existing credentials for these platforms will be replaced
                  with the imported ones.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {newPlatforms.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileDown className="h-4 w-4 text-primary" />
                New platforms to be added:
              </div>
              <div className="flex flex-wrap gap-2">
                {newPlatforms.map((platform) => (
                  <Badge key={platform} variant="outline">
                    {formatPlatformName(platform)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Alert>
            <AlertDescription className="text-sm">
              <p className="font-semibold mb-1">Before you proceed:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Make sure you trust the source of this backup file</li>
                <li>
                  Consider exporting your current credentials first as a backup
                </li>
                <li>You can test the imported credentials after import</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-primary hover:bg-primary/90"
          >
            Import Credentials
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
