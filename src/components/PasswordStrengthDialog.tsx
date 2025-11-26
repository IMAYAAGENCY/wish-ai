import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { checkPasswordStrength } from "@/lib/passwordStrength";

interface PasswordStrengthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (password: string) => void;
  title?: string;
  description?: string;
}

export function PasswordStrengthDialog({
  open,
  onOpenChange,
  onConfirm,
  title = "Set Encryption Password",
  description = "Create a strong password to encrypt your credentials backup. You will need this password to restore your credentials.",
}: PasswordStrengthDialogProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const strength = checkPasswordStrength(password);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = strength.score >= 3 && passwordsMatch;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canSubmit) {
      onConfirm(password);
      setPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setConfirmPassword("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                autoComplete="new-password"
              />
            </div>

            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Password Strength</span>
                  <span className="font-medium" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
                <Progress
                  value={strength.percentage}
                  className="h-2"
                  style={{
                    // @ts-ignore - CSS custom property
                    '--progress-background': strength.color,
                  } as React.CSSProperties}
                />
              </div>
            )}

            {/* Requirements Checklist */}
            {password.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Requirements:</p>
                <div className="space-y-1">
                  <RequirementItem
                    met={strength.requirements.minLength}
                    text="At least 12 characters"
                  />
                  <RequirementItem
                    met={strength.requirements.hasUppercase}
                    text="Contains uppercase letter (A-Z)"
                  />
                  <RequirementItem
                    met={strength.requirements.hasLowercase}
                    text="Contains lowercase letter (a-z)"
                  />
                  <RequirementItem
                    met={strength.requirements.hasNumber}
                    text="Contains number (0-9)"
                  />
                  <RequirementItem
                    met={strength.requirements.hasSpecial}
                    text="Contains special character (!@#$%...)"
                  />
                </div>
              </div>
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                autoComplete="new-password"
              />
              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
              {passwordsMatch && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Show Password Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="show-password"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="rounded border-input"
              />
              <Label htmlFor="show-password" className="text-sm font-normal cursor-pointer">
                Show password
              </Label>
            </div>

            {/* Warning for weak password */}
            {password.length > 0 && strength.score < 3 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please use a stronger password to protect your sensitive credentials.
                  A strong password is required for export.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              Encrypt & Export
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <span className={met ? "text-foreground" : "text-muted-foreground"}>{text}</span>
    </div>
  );
}
