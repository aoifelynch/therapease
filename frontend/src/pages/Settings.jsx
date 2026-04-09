import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { PageHeader } from '../components/PageHeader';
import { PageTitleRow } from '../components/PageTitleRow';
import { ConfirmModal } from '../components/ConfirmModal';
import { useLiveNow } from '../hooks/useLiveNow';
import { SectionCard } from '../components/SectionCard';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/api';
import { toast } from '../utils/toastBus';
import { theme } from '../utils/theme';
import { withAlpha, formatLongDate } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';

const faqItems = [
  {
    id: 'faq-security',
    question: 'How do I secure my account?',
    answer: 'Use a strong unique password and keep two-factor authentication enabled. You can also review your session activity regularly.',
  },
  {
    id: 'faq-delete',
    question: 'What happens if I delete my account?',
    answer: 'Deleting your account permanently removes profile and workspace access. This action cannot be undone.',
  },
  {
    id: 'faq-export',
    question: 'Can I export my data?',
    answer: 'Yes. Use the export action to generate a downloadable archive of your account data and settings.',
  },
  {
    id: 'faq-profile',
    question: 'Can I update profile details later?',
    answer: 'Yes. You can return to Settings at any time to update your profile information and account security details.',
  },
];

const settingCardStyle = {
  ...componentStyles.card,
  borderRadius: '18px',
  padding: '1rem',
};

const sectionHeadingStyle = {
  color: theme.colors.secondary.charcoal,
  fontFamily: theme.fonts.serif,
};

const inputClassName = 'w-full rounded-xl border px-3 py-2.5 text-sm transition-all focus:outline-none';

const inputStyle = {
  borderColor: componentStyles.border,
  backgroundColor: theme.colors.gray[50],
  color: theme.colors.secondary.charcoal,
  fontFamily: theme.fonts.serif,
};

const primaryButtonStyle = {
  backgroundColor: theme.colors.primary.DEFAULT,
  color: theme.colors.gray[50],
  fontFamily: theme.fonts.serif,
  boxShadow: `0 4px 14px ${withAlpha(theme.colors.primary.DEFAULT, 0.35)}`,
};

const secondaryButtonStyle = {
  backgroundColor: theme.colors.gray[50],
  color: theme.colors.secondary.charcoal,
  border: `1px solid ${componentStyles.border}`,
  fontFamily: theme.fonts.serif,
};

const getUserFromAuthPayload = (payload) => payload?.data?.user || payload?.user || null;

export function Settings() {
  const navigate = useNavigate();
  const { user, updateUser, logout } = useAuth();
  const [activeNav, setActiveNav] = useState('Settings');
  const [openFaqId, setOpenFaqId] = useState(faqItems[0].id);
  const now = useLiveNow();
  const [loading, setLoading] = useState(!user);
  const [currentUser, setCurrentUser] = useState(user || null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalPassword, setDeleteModalPassword] = useState('');

  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    nextPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    let isMounted = true;

    const loadCurrentUser = async () => {
      if (!currentUser) {
        setLoading(true);
      }

      try {
        const response = await authAPI.getMe();
        const nextUser = getUserFromAuthPayload(response);

        if (isMounted && nextUser) {
          setCurrentUser(nextUser);
          updateUser(nextUser);
          setAccountForm({
            name: nextUser.name || '',
            email: nextUser.email || '',
          });
        }
      } catch (requestError) {
        const message = requestError?.response?.data?.message || requestError?.message || 'Unable to load your account details.';
        if (isMounted) {
          toast.error(message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveChanges = async (event) => {
    event.preventDefault();

    const normalizedName = accountForm.name.trim();
    const normalizedEmail = accountForm.email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail) {
      toast.error('Name and email are required.');
      return;
    }

    const hasPasswordInput = Boolean(passwordForm.currentPassword || passwordForm.nextPassword || passwordForm.confirmPassword);
    if (hasPasswordInput) {
      if (!passwordForm.currentPassword || !passwordForm.nextPassword || !passwordForm.confirmPassword) {
        toast.error('All password fields are required.');
        return;
      }

      if (passwordForm.nextPassword !== passwordForm.confirmPassword) {
        toast.error('New password and confirmation do not match.');
        return;
      }
    }

    setSavingProfile(true);

    try {
      const updatePayload = {
        name: normalizedName,
        email: normalizedEmail,
      };

      if (hasPasswordInput) {
        updatePayload.currentPassword = passwordForm.currentPassword;
        updatePayload.newPassword = passwordForm.nextPassword;
      }

      const response = await authAPI.updateProfile(updatePayload);

      const nextUser = response?.user;
      if (nextUser) {
        setCurrentUser(nextUser);
        updateUser(nextUser);
        setAccountForm({
          name: nextUser.name || '',
          email: nextUser.email || '',
        });
      }

      setPasswordForm({ currentPassword: '', nextPassword: '', confirmPassword: '' });
    } catch (requestError) {
      // API errors are surfaced by the global API error toast interceptor.
      void requestError;
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteAccount = async () => {
    const normalizedPassword = deleteModalPassword.trim();
    if (!normalizedPassword) {
      toast.error('Please enter your password to delete your account.');
      return;
    }

    setDeletingAccount(true);

    try {
      await authAPI.deleteAccount(normalizedPassword);
      setDeleteModalOpen(false);
      setDeleteModalPassword('');
      logout();
      navigate('/login');
    } catch (requestError) {
      // API errors are surfaced by the global API error toast interceptor.
      void requestError;
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleResetProfile = () => {
    setAccountForm({
      name: currentUser?.name || '',
      email: currentUser?.email || '',
    });
    setPasswordForm({ currentPassword: '', nextPassword: '', confirmPassword: '' });
    toast.success('Profile form reset.');
  };

  const openDeleteModal = () => {
    setDeleteModalPassword('');
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    if (deletingAccount) return;
    setDeleteModalOpen(false);
    setDeleteModalPassword('');
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={currentUser || user} />

        <main className="h-screen flex-1 overflow-y-auto">
          <PageHeader userName={currentUser?.name || user?.name} now={now} />

          <div className="space-y-6 px-6 py-6 md:px-8">
            <PageTitleRow title="Settings" />

            {loading ? (
              <SectionCard className="rounded-3xl" bodyClassName="space-y-0">
                <p className="text-sm" style={{ color: componentStyles.mutedText, fontFamily: theme.fonts.serif }}>
                  Loading account settings...
                </p>
              </SectionCard>
            ) : (
              <>
                <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
                  <article className="space-y-4">
                    <SectionCard
                      title="Account Overview"
                      className="rounded-xl"
                      bodyClassName="space-y-0"
                    >

                      <div className="grid gap-3 sm:grid-cols-2" style={{ fontFamily: theme.fonts.serif }}>
                        <div className="rounded-xl border p-3.5" style={{ borderColor: componentStyles.lightBorder, backgroundColor: withAlpha(theme.colors.secondary.beige, 0.2) }}>
                          <p className="text-xs uppercase tracking-[0.08em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Name</p>
                          <p className="mt-2 text-base font-semibold break-words" style={{ color: theme.colors.secondary.charcoal }}>
                            {currentUser?.name || 'Therapist'}
                          </p>
                        </div>

                        <div className="rounded-xl border p-3.5" style={{ borderColor: componentStyles.lightBorder, backgroundColor: withAlpha(theme.colors.secondary.beige, 0.2) }}>
                          <p className="text-xs uppercase tracking-[0.08em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Email</p>
                          <p className="mt-2 text-base font-semibold break-words" style={{ color: theme.colors.secondary.charcoal }}>
                            {currentUser?.email || 'No email on file'}
                          </p>
                        </div>

                        <div className="rounded-xl border p-3.5" style={{ borderColor: componentStyles.subtleBorder, backgroundColor: withAlpha(theme.colors.primary.lighter, 0.24) }}>
                          <p className="text-xs uppercase tracking-[0.08em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>2FA Status</p>
                          <span className="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.14), color: theme.colors.primary.darker }}>
                            <span className="mr-2 h-2 w-2 rounded-full" style={{ backgroundColor: theme.colors.primary.DEFAULT }} />
                            {currentUser?.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                          </span>
                        </div>

                        <div className="rounded-xl border p-3.5" style={{ borderColor: componentStyles.lightBorder, backgroundColor: withAlpha(theme.colors.secondary.beige, 0.2) }}>
                          <p className="text-xs uppercase tracking-[0.08em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Account Created</p>
                          <p className="mt-2 text-base font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                            {currentUser?.createdAt ? formatLongDate(new Date(currentUser.createdAt)) : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Security Actions" className="rounded-xl" bodyClassName="space-y-0">

                      <div className="grid gap-3 sm:grid-cols-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
                          style={{ backgroundColor: theme.colors.primary.DEFAULT, color: theme.colors.gray[50] }}
                          onClick={() => navigate('/setup-2fa')}
                        >
                          Manage 2FA
                        </button>
                        <button
                          type="button"
                          disabled={deletingAccount}
                          className="inline-flex items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
                          style={{
                            backgroundColor: theme.colors.error.bg,
                            color: theme.colors.error.text,
                            cursor: deletingAccount ? 'not-allowed' : 'pointer',
                          }}
                          onClick={openDeleteModal}
                        >
                          Delete Account
                        </button>
                      </div>
                    </SectionCard>
                  </article>

                  <SectionCard title="Edit Profile" className="rounded-xl" bodyClassName="space-y-0">

                    <form onSubmit={handleSaveChanges} className="space-y-4">
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-1 text-sm" style={{ color: componentStyles.subtleText, fontFamily: theme.fonts.serif }}>
                          Full name
                          <input
                            className={inputClassName}
                            style={inputStyle}
                            value={accountForm.name}
                            onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))}
                          />
                        </label>
                        <label className="space-y-1 text-sm" style={{ color: componentStyles.subtleText, fontFamily: theme.fonts.serif }}>
                          Email address
                          <input
                            type="email"
                            className={inputClassName}
                            style={inputStyle}
                            value={accountForm.email}
                            onChange={(event) => setAccountForm((current) => ({ ...current, email: event.target.value }))}
                          />
                        </label>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="space-y-1 text-sm" style={{ color: componentStyles.subtleText, fontFamily: theme.fonts.serif }}>
                          Current password
                          <input
                            type="password"
                            className={inputClassName}
                            style={inputStyle}
                            value={passwordForm.currentPassword}
                            onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))}
                          />
                        </label>
                        <label className="space-y-1 text-sm" style={{ color: componentStyles.subtleText, fontFamily: theme.fonts.serif }}>
                          New password
                          <input
                            type="password"
                            className={inputClassName}
                            style={inputStyle}
                            value={passwordForm.nextPassword}
                            onChange={(event) => setPasswordForm((current) => ({ ...current, nextPassword: event.target.value }))}
                          />
                        </label>
                      </div>

                      <label className="space-y-1 text-sm block" style={{ color: componentStyles.subtleText, fontFamily: theme.fonts.serif }}>
                        Confirm new password
                        <input
                          type="password"
                          className={inputClassName}
                          style={inputStyle}
                          value={passwordForm.confirmPassword}
                          onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))}
                        />
                      </label>

                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        <button type="submit" disabled={savingProfile} className="rounded-xl px-5 py-2.5 text-sm font-medium transition-colors" style={{ ...primaryButtonStyle, opacity: savingProfile ? 0.88 : 1 }}>
                          {savingProfile ? 'Saving...' : 'Save Profile'}
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium"
                          style={secondaryButtonStyle}
                          onClick={handleResetProfile}
                        >
                          Discard Changes
                        </button>
                      </div>
                    </form>
                  </SectionCard>
                </section>
              </>
            )}

            <SectionCard title="Frequently Asked Questions" className="rounded-3xl" bodyClassName="space-y-0">
              <p className="mb-4 text-sm" style={{ color: componentStyles.mutedText, fontFamily: theme.fonts.serif }}>
                  Quick guidance for common account and settings questions.
              </p>

              <div className="space-y-3">
                {faqItems.map((item) => {
                  const isOpen = openFaqId === item.id;

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border"
                      style={{ borderColor: componentStyles.lightBorder, backgroundColor: withAlpha(theme.colors.secondary.beige, 0.2) }}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                        className="flex w-full items-center justify-between px-4 py-3 text-left"
                      >
                        <span className="text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.serif }}>
                          {item.question}
                        </span>
                        <span style={{ color: theme.colors.primary.DEFAULT, fontFamily: theme.fonts.serif }}>{isOpen ? '-' : '+'}</span>
                      </button>

                      {isOpen && (
                        <div className="border-t px-4 py-3 text-sm" style={{ borderColor: componentStyles.lightBorder, color: componentStyles.mutedText, fontFamily: theme.fonts.serif }}>
                          {item.answer}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </SectionCard>

            <ConfirmModal
              isOpen={deleteModalOpen}
              title="Confirm Account Deletion"
              description="Enter your password to permanently delete your account."
              onCancel={closeDeleteModal}
              onConfirm={handleDeleteAccount}
              isBusy={deletingAccount}
              confirmLabel="Delete Account"
            >
              <div className="mt-4">
                <input
                  type="password"
                  className={inputClassName}
                  style={inputStyle}
                  placeholder="Password"
                  value={deleteModalPassword}
                  onChange={(event) => setDeleteModalPassword(event.target.value)}
                />
              </div>
            </ConfirmModal>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Settings;
