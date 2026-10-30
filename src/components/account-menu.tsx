import { useState } from "react";

import { texts } from "@/texts";
import type { AccountMenuProps } from "@/types/components/account/account-menu-props";
import { AccountMenu as AccountMenuView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { logout } from "@/lib/logout";

import { ChangeEmailDialog } from "./change-email-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { HealthyUsageDialog } from "./healthy-usage/healthy-usage-dialog";
import { LinkedAccountsDialog } from "./linked-accounts-dialog";
import { PushToggle } from "./push-toggle";

const ACCOUNT_MENU_HREFS = {
  corporateProfile: "/profissional",
  wallet: "/carteira",
  // O marketplace é uma aba da Carteira; /marketplace só redireciona para cá.
  marketplace: "/carteira?tab=marketplace",
  support: "/suporte",
  security: "/seguranca",
  blockedUsers: "/bloqueados",
  myReports: "/denuncias",
  sanctions: "/penalidades",
  guardian: "/responsavel",
  moderator: "/moderador",
  apoie: "/apoiar",
  notificationPreferences: "/notificacoes/preferencias",
};

/**
 * Account menu: logout and the account dialogs around the design system menu. The Social /
 * Profissional switch lives on top of the main navigation (ContextSwitcher).
 */
export function AccountMenu({ profile }: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showLinkedAccounts, setShowLinkedAccounts] = useState(false);
  const [showHealthyUsage, setShowHealthyUsage] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast } = useToast();

  const openDialog = (show: (open: boolean) => void) => () => {
    setMenuOpen(false);
    show(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    if (await logout()) return;
    setLoggingOut(false);
    toast(texts.account.menu.logoutFailed, "error", {
      label: texts.account.menu.logoutRetry,
      onClick: () => void handleLogout(),
    });
  };

  return (
    <>
      <AccountMenuView
        profile={profile}
        hrefs={{ ...ACCOUNT_MENU_HREFS, profile: `/perfil/${profile.username}` }}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onChangeEmail={openDialog(setShowChangeEmail)}
        onChangePassword={openDialog(setShowChangePassword)}
        onOpenLinkedAccounts={openDialog(setShowLinkedAccounts)}
        onOpenHealthyUsage={openDialog(setShowHealthyUsage)}
        onDeleteAccount={openDialog(setShowDeleteAccount)}
        onLogout={() => void handleLogout()}
        loggingOut={loggingOut}
        pushToggle={<PushToggle onClose={() => setMenuOpen(false)} />}
      />
      <ChangeEmailDialog
        open={showChangeEmail}
        onOpenChange={setShowChangeEmail}
        currentEmail={profile.email}
      />
      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
      <DeleteAccountDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount} />
      <LinkedAccountsDialog open={showLinkedAccounts} onOpenChange={setShowLinkedAccounts} />
      <HealthyUsageDialog open={showHealthyUsage} onOpenChange={setShowHealthyUsage} />
    </>
  );
}
