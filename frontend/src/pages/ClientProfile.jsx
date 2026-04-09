import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppSidebar } from '../components/AppSidebar';
import { PageHeader } from '../components/PageHeader';
import { ErrorAlert } from '../components/ErrorAlert';
import { FormModal } from '../components/FormModal';
import { ConfirmModal } from '../components/ConfirmModal';
import { useLiveNow } from '../hooks/useLiveNow';
import { SectionCard } from '../components/SectionCard';
import { clientsAPI, filesAPI, notesAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { theme } from '../utils/theme';
import { withAlpha, formatLongDate, formatClock, formatCurrency } from '../utils/formatters';
import { componentStyles } from '../utils/componentStyles';
import { BackIcon, EditIcon, TrashIcon } from '../utils/icons';

export function ClientProfile() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeNav, setActiveNav] = useState('Clients');
  const [activeTab, setActiveTab] = useState('notes');
  const now = useLiveNow();
  const [client, setClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');
  const [isNoteEditorOpen, setIsNoteEditorOpen] = useState(false);
  const [noteBusy, setNoteBusy] = useState(false);
  const [noteStatusMessage, setNoteStatusMessage] = useState('');
  const [fileUploadBusy, setFileUploadBusy] = useState(false);
  const [fileBusyId, setFileBusyId] = useState(null);
  const [fileStatusMessage, setFileStatusMessage] = useState('');
  const [showAllFiles, setShowAllFiles] = useState(false);
  const [viewingNote, setViewingNote] = useState(null);
  const [historySortOrder, setHistorySortOrder] = useState('newest');
  const [showNoteSavedPopup, setShowNoteSavedPopup] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editClientBusy, setEditClientBusy] = useState(false);
  const [editClientMessage, setEditClientMessage] = useState('');
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [deleteClientBusy, setDeleteClientBusy] = useState(false);
  const [deleteClientMessage, setDeleteClientMessage] = useState('');
  const [showDeleteNoteModal, setShowDeleteNoteModal] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleteNoteBusy, setDeleteNoteBusy] = useState(false);
  const [deleteNoteMessage, setDeleteNoteMessage] = useState('');
  const [showDeleteFileModal, setShowDeleteFileModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteFileBusy, setDeleteFileBusy] = useState(false);
  const [deleteFileMessage, setDeleteFileMessage] = useState('');
  const [editClientForm, setEditClientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    profileNotes: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
  });
  const fileInputRef = useRef(null);
  const autosaveTimeoutRef = useRef(null);
  const lastSavedPayloadRef = useRef('');

  const openEditClientModal = () => {
    if (!client) return;

    setEditClientForm({
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      email: client.email || '',
      phone: client.phone || '',
      dateOfBirth: client.dateOfBirth ? client.dateOfBirth.split('T')[0] : '',
      address: client.address || '',
      profileNotes: client.profileNotes || '',
      emergencyContactName: client.emergencyContact?.name || '',
      emergencyContactPhone: client.emergencyContact?.phone || '',
    });
    setEditClientMessage('');
    setShowEditClientModal(true);
  };

  const closeEditClientModal = () => {
    if (editClientBusy) return;
    setShowEditClientModal(false);
    setEditClientMessage('');
  };

  const closeDeleteClientModal = () => {
    if (deleteClientBusy) return;
    setShowDeleteClientModal(false);
    setDeleteClientMessage('');
  };

  const closeDeleteNoteModal = () => {
    if (deleteNoteBusy) return;
    setShowDeleteNoteModal(false);
    setNoteToDelete(null);
    setDeleteNoteMessage('');
  };

  const closeDeleteFileModal = () => {
    if (deleteFileBusy) return;
    setShowDeleteFileModal(false);
    setFileToDelete(null);
    setDeleteFileMessage('');
  };

  const handleSaveClientDetails = async (event) => {
    event.preventDefault();
    setEditClientMessage('');

    const normalizedFirstName = editClientForm.firstName.trim().replace(/\s+/g, ' ');
    const normalizedLastName = editClientForm.lastName.trim().replace(/\s+/g, ' ');
    const normalizedEmail = editClientForm.email.trim().toLowerCase();
    const normalizedPhone = editClientForm.phone.trim();
    const normalizedDateOfBirth = editClientForm.dateOfBirth.trim();
    const normalizedAddress = editClientForm.address.trim();
    const normalizedProfileNotes = editClientForm.profileNotes.trim();
    const normalizedEmergencyContactName = editClientForm.emergencyContactName.trim();
    const normalizedEmergencyContactPhone = editClientForm.emergencyContactPhone.trim();

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedPhone) {
      setEditClientMessage('First name, last name, email, and phone are required.');
      return;
    }

    setEditClientBusy(true);

    try {
      const response = await clientsAPI.update(clientId, {
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        phone: normalizedPhone,
        dateOfBirth: normalizedDateOfBirth || undefined,
        address: normalizedAddress || undefined,
        profileNotes: normalizedProfileNotes || undefined,
        emergencyContact: (normalizedEmergencyContactName || normalizedEmergencyContactPhone)
          ? {
            name: normalizedEmergencyContactName || undefined,
            phone: normalizedEmergencyContactPhone || undefined,
          }
          : undefined,
      });

      setClient(response.data);
      setShowEditClientModal(false);
    } catch (requestError) {
      setEditClientMessage(requestError.response?.data?.message || requestError.message || 'Unable to update client');
    } finally {
      setEditClientBusy(false);
    }
  };

  const handleDeleteClient = async () => {
    setDeleteClientMessage('');
    setDeleteClientBusy(true);

    try {
      await clientsAPI.delete(clientId);
      navigate('/clients');
    } catch (requestError) {
      setDeleteClientMessage(requestError.response?.data?.message || requestError.message || 'Unable to delete client');
    } finally {
      setDeleteClientBusy(false);
    }
  };

  const resetNoteEditor = useCallback((message = '') => {
    setEditingNoteId(null);
    setNoteContent('');
    setSelectedTemplate('');
    setSelectedAppointmentId('');
    setIsNoteEditorOpen(false);
    setNoteStatusMessage(message);
    lastSavedPayloadRef.current = '';
  }, []);

  useEffect(() => {
    const loadClientData = async () => {
      setLoading(true);
      setError('');

      try {
        const clientResponse = await clientsAPI.getById(clientId);
        const payload = clientResponse.data || {};

        setClient(payload.client || null);
        setAppointments(payload.appointments || []);
        setFiles(payload.files || []);
        setNotes(payload.notes || []);
        setPayments(payload.payments || []);

        // Keep the editor closed/clean on load; users explicitly open it to start or edit notes.
        resetNoteEditor('');
      } catch (requestError) {
        setError(requestError.response?.data?.message || requestError.message || 'Unable to load client');
        setClient(null);
        setAppointments([]);
        setFiles([]);
        setNotes([]);
        setPayments([]);
        resetNoteEditor('');
      } finally {
        setLoading(false);
      }
    };

    if (clientId) {
      loadClientData();
    }
  }, [clientId, resetNoteEditor]);

  const templateScaffolds = {
    SOAP: 'Subjective:\n\nObjective:\n\nAssessment:\n\nPlan:\n',
    DAP: 'Data:\n\nAssessment:\n\nPlan:\n',
    BIRP: 'Behavior:\n\nIntervention:\n\nResponse:\n\nPlan:\n',
    PIP: 'Presentation:\n\nIntervention:\n\nPlan:\n',
  };

  const notesSorted = useMemo(
    () => [...notes].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)),
    [notes],
  );

  const displayedFiles = useMemo(
    () => (showAllFiles ? files : files.slice(0, 3)),
    [files, showAllFiles],
  );

  const composeNotePayload = useCallback(() => {
    const payload = {
      content: noteContent.trim(),
    };

    if (selectedTemplate) {
      payload.templateType = selectedTemplate;
    }

    if (selectedAppointmentId) {
      payload.appointmentId = selectedAppointmentId;
    }

    return payload;
  }, [noteContent, selectedAppointmentId, selectedTemplate]);

  const applySavedNote = useCallback((savedNote) => {
    const noteId = savedNote.id || savedNote._id;

    setEditingNoteId(noteId);
    setSelectedTemplate(savedNote.templateType || '');
    setSelectedAppointmentId(savedNote.appointment?.id || savedNote.appointment?._id || savedNote.appointment || '');

    setNotes((current) => {
      const exists = current.some((note) => (note.id || note._id) === noteId);
      if (exists) {
        return current.map((note) => ((note.id || note._id) === noteId ? savedNote : note));
      }

      return [savedNote, ...current];
    });

    lastSavedPayloadRef.current = JSON.stringify({
      content: savedNote.content || '',
      templateType: savedNote.templateType || '',
      appointmentId: savedNote.appointment?.id || savedNote.appointment?._id || savedNote.appointment || '',
    });
  }, []);

  const saveCurrentNote = useCallback(async ({ auto = false } = {}) => {
    const payload = composeNotePayload();
    if (!payload.content) {
      if (!auto) {
        setNoteStatusMessage('Note content is required');
      }
      return;
    }

    if (!payload.appointmentId) {
      if (!auto) {
        setNoteStatusMessage('Select an appointment before saving');
      }
      return;
    }

    if (!auto) {
      setNoteBusy(true);
    }
    setNoteStatusMessage('');

    try {
      const response = editingNoteId
        ? await notesAPI.update(editingNoteId, payload)
        : await clientsAPI.createNote(clientId, payload);

      const savedNote = response.data;
      applySavedNote(savedNote);
      setNoteContent(savedNote.content || '');
      if (auto) {
        setNoteStatusMessage('Draft auto-saved');
      } else {
        setIsNoteEditorOpen(false);
        setNoteStatusMessage('Note saved');
        setShowNoteSavedPopup(true);
      }
    } catch (requestError) {
      setNoteStatusMessage(requestError.response?.data?.message || 'Unable to save note');
    } finally {
      if (!auto) {
        setNoteBusy(false);
      }
    }
  }, [applySavedNote, clientId, composeNotePayload, editingNoteId]);

  const startNewNote = () => {
    setEditingNoteId(null);
    setSelectedAppointmentId('');
    setSelectedTemplate('');
    setNoteContent('');
    setIsNoteEditorOpen(true);
    setNoteStatusMessage('');
    setShowNoteSavedPopup(false);
    lastSavedPayloadRef.current = '';
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setNoteContent(templateScaffolds[template]);
    setIsNoteEditorOpen(true);
    setShowNoteSavedPopup(false);
  };

  const handleEditNote = (note) => {
    const noteId = note.id || note._id;

    setEditingNoteId(noteId);
    setNoteContent(note.content || '');
    setSelectedTemplate(note.templateType || '');
    setSelectedAppointmentId(note.appointment?.id || note.appointment?._id || note.appointment || '');
    setIsNoteEditorOpen(true);
    setNoteStatusMessage('');
    setShowNoteSavedPopup(false);

    lastSavedPayloadRef.current = JSON.stringify({
      content: note.content || '',
      templateType: note.templateType || '',
      appointmentId: note.appointment?.id || note.appointment?._id || note.appointment || '',
    });
  };

  const handleCancelNoteEdit = () => {
    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    if (!editingNoteId) {
      resetNoteEditor('Draft discarded');
      return;
    }

    const existing = notes.find((note) => (note.id || note._id) === editingNoteId);
    if (!existing) {
      resetNoteEditor('Draft discarded');
      return;
    }

    setNoteContent(existing.content || '');
    setSelectedTemplate(existing.templateType || '');
    setSelectedAppointmentId(existing.appointment?.id || existing.appointment?._id || existing.appointment || '');
    setIsNoteEditorOpen(false);
    setNoteStatusMessage('Changes discarded');
  };

  const handleDeleteNote = (noteId) => {
    setNoteToDelete({ id: noteId });
    setDeleteNoteMessage('');
    setShowDeleteNoteModal(true);
  };

  const handleConfirmDeleteNote = async () => {
    if (!noteToDelete?.id) return;

    setDeleteNoteBusy(true);
    setDeleteNoteMessage('');

    try {
      await notesAPI.delete(noteToDelete.id);
      setNotes((current) => current.filter((note) => (note.id || note._id) !== noteToDelete.id));

      if (editingNoteId === noteToDelete.id) {
        resetNoteEditor('');
      }

      setNoteStatusMessage('Note deleted');
      closeDeleteNoteModal();
    } catch (requestError) {
      setDeleteNoteMessage(requestError.response?.data?.message || requestError.message || 'Unable to delete note');
    } finally {
      setDeleteNoteBusy(false);
    }
  };

  const handleOpenFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleUploadFile = async (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    setFileUploadBusy(true);
    setFileStatusMessage('');

    try {
      const localPreviewUrl = URL.createObjectURL(selectedFile);

      const response = await filesAPI.upload({
        clientId,
        fileName: selectedFile.name,
        fileType: selectedFile.type || 'application/octet-stream',
        fileURL: localPreviewUrl,
      });

      setFiles((current) => [response.data, ...current]);
      setFileStatusMessage('File uploaded');
    } catch (requestError) {
      setFileStatusMessage(requestError.response?.data?.message || 'Unable to upload file');
    } finally {
      setFileUploadBusy(false);
      event.target.value = '';
    }
  };

  const isImageFile = (file) => {
    const fileType = String(file.fileType || '').toLowerCase();
    const fileName = String(file.fileName || file.name || '').toLowerCase();
    return fileType.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(fileName);
  };

  const handleOpenFile = (file) => {
    const targetUrl = file.fileURL || file.url || '';

    if (!targetUrl) {
      setFileStatusMessage('This file cannot be opened yet.');
      return;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleDeleteFile = (fileId) => {
    setFileToDelete({ id: fileId });
    setDeleteFileMessage('');
    setShowDeleteFileModal(true);
  };

  const handleConfirmDeleteFile = async () => {
    if (!fileToDelete?.id) return;

    setDeleteFileBusy(true);
    setDeleteFileMessage('');

    try {
      await filesAPI.delete(fileToDelete.id);
      setFiles((current) => current.filter((file) => (file._id || file.id) !== fileToDelete.id));
      setFileStatusMessage('File deleted');
      closeDeleteFileModal();
    } catch (requestError) {
      setDeleteFileMessage(requestError.response?.data?.message || requestError.message || 'Unable to delete file');
    } finally {
      setDeleteFileBusy(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'notes') return;
    if (!isNoteEditorOpen) return;
    if (!editingNoteId) return;

    const payload = composeNotePayload();
    if (!payload.content) return;
    if (!payload.appointmentId) return;

    const serialized = JSON.stringify({
      content: payload.content,
      templateType: payload.templateType,
      appointmentId: payload.appointmentId || '',
    });

    if (serialized === lastSavedPayloadRef.current) return;

    if (autosaveTimeoutRef.current) {
      window.clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = window.setTimeout(() => {
      saveCurrentNote({ auto: true });
    }, 1500);

    return () => {
      if (autosaveTimeoutRef.current) {
        window.clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [activeTab, composeNotePayload, editingNoteId, isNoteEditorOpen, noteContent, saveCurrentNote, selectedAppointmentId, selectedTemplate]);

  const formatShortDate = (value) => new Intl.DateTimeFormat('en-IE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

  const historyItems = useMemo(() => {
    const items = [];

    if (client?.createdAt) {
      items.push({
        id: `client-created-${client.id || client._id}`,
        date: new Date(client.createdAt),
        title: 'Client profile created',
        subtitle: 'Initial client record added',
      });
    }

    appointments.forEach((appointment) => {
      if (!appointment?.date) return;

      const appointmentType = appointment.type === 'online' ? 'Online session' : 'In-person session';
      items.push({
        id: `appointment-${appointment.id || appointment._id}`,
        date: new Date(appointment.date),
        title: appointmentType,
        subtitle: `${appointment.startTime || ''}${appointment.startTime ? ' • ' : ''}${appointment.status || 'scheduled'}`,
      });
    });

    notes.forEach((note) => {
      if (!note?.createdAt) return;

      items.push({
        id: `note-${note.id || note._id}`,
        date: new Date(note.createdAt),
        title: 'Session notes created',
        subtitle: note.templateType ? `${note.templateType} template` : 'Standard session note',
      });
    });

    return items;
  }, [appointments, client, notes]);

  const orderedHistoryItems = useMemo(() => {
    const sorted = [...historyItems].sort((first, second) => first.date - second.date);
    return historySortOrder === 'newest' ? sorted.reverse() : sorted;
  }, [historyItems, historySortOrder]);

  if (loading) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream }}>
        <AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={user} />
        <main className="flex flex-1 items-center justify-center">
          <p style={{ color: theme.colors.secondary.charcoal }}>Loading client...</p>
        </main>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream }}>
        <AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={user} />
        <main className="flex flex-1 items-center justify-center">
          <p style={{ color: theme.colors.secondary.charcoal }}>Client not found</p>
        </main>
      </div>
    );
  }

  const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || 'Unnamed client';
  const emergencyContactName = client.emergencyContact?.name || '';
  const emergencyContactPhone = client.emergencyContact?.phone || '';
  const emergencyContactAddress = client.emergencyContact?.address || '';

  const nextAppointment = appointments
    .filter((apt) => apt.status === 'upcoming')
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;

  const clientStatus = String(client.status || (nextAppointment ? 'active' : 'inactive')).toLowerCase() === 'active'
    ? 'active'
    : 'inactive';
  const isClientActive = clientStatus === 'active';

  const canSaveNote = Boolean(noteContent.trim()) && Boolean(selectedAppointmentId);

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme.colors.secondary.cream, color: theme.colors.secondary.charcoal, fontFamily: theme.fonts.sans }}>
      <AppSidebar activeNav={activeNav} onNavSelect={setActiveNav} user={user} />

      <main className="h-screen flex-1 overflow-y-auto">
        <PageHeader userName={user?.name} now={now} />

        <div className="space-y-5 px-6 py-6 md:px-8">
          <ErrorAlert message={error} />

          {/* Back button and client header */}
          <button
            type="button"
            onClick={() => navigate('/clients')}
            className="flex items-center gap-2 text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: theme.colors.primary.DEFAULT }}
          >
            <BackIcon />
            Back
          </button>

          <div className="grid gap-6 xl:grid-cols-[1fr_2fr]">
            {/* Left column - Client info and emergency contact */}
            <div className="space-y-4">
              {/* Client Info Card */}
              <SectionCard
                title={clientName}
                action={(
                  <button
                    type="button"
                    className="rounded-full px-3 py-1 text-xs font-semibold capitalize"
                    style={{
                      backgroundColor: isClientActive
                        ? withAlpha(theme.colors.secondary.sage, 0.95)
                        : withAlpha(theme.colors.secondary.beige, 0.7),
                      color: isClientActive
                        ? theme.colors.primary.darker
                        : withAlpha(theme.colors.secondary.charcoal, 0.75),
                    }}
                    aria-label={`Client status: ${clientStatus}`}
                  >
                    {clientStatus}
                  </button>
                )}
                bodyClassName="space-y-0"
              >

                <div className="space-y-3 text-sm">
                  {client.email && (
                    <div>
                      <p style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Email</p>
                      <p className="text-base font-medium">{client.email}</p>
                    </div>
                  )}
                  {client.phone && (
                    <div>
                      <p style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Phone</p>
                      <p className="text-base font-medium">{client.phone}</p>
                    </div>
                  )}
                  {client.dateOfBirth && (
                    <div>
                      <p style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>DOB</p>
                      <p className="text-base font-medium">
                        {new Intl.DateTimeFormat('en-IE', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(client.dateOfBirth))}
                      </p>
                    </div>
                  )}
                  {client.address && (
                    <div>
                      <p style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Address</p>
                      <p className="text-base font-medium">{client.address}</p>
                    </div>
                  )}
                  {client.profileNotes && (
                    <div>
                      <p style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Profile Notes</p>
                      <p className="text-base font-medium whitespace-pre-wrap">{client.profileNotes}</p>
                    </div>
                  )}
                </div>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={openEditClientModal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
                    style={{ backgroundColor: theme.colors.primary.DEFAULT, color: theme.colors.gray[50] }}
                  >
                    <EditIcon />
                    Edit Client
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteClientMessage('');
                      setShowDeleteClientModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors"
                    style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text }}
                  >
                    <TrashIcon />
                    Delete Client
                  </button>
                </div>
              </SectionCard>

              {/* Emergency Contact Card */}
              {(emergencyContactName || emergencyContactPhone || emergencyContactAddress) && (
                <SectionCard
                  title="Emergency Contact"
                  className="rounded-3xl"
                  bodyClassName="space-y-0"
                >
                  <div className="space-y-3 text-sm">
                    {emergencyContactName && (
                      <div>
                        <p style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Name</p>
                        <p className="text-base font-semibold">{emergencyContactName}</p>
                      </div>
                    )}
                    {emergencyContactPhone && (
                      <div>
                        <p style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Phone</p>
                        <p className="text-base font-semibold">{emergencyContactPhone}</p>
                      </div>
                    )}
                    {emergencyContactAddress && (
                      <div>
                        <p style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}>Address</p>
                        <p className="text-base font-semibold whitespace-pre-wrap">{emergencyContactAddress}</p>
                      </div>
                    )}
                  </div>
                </SectionCard>
              )}

              {/* Next Appointment Card */}
              {nextAppointment && (
                <SectionCard title="Next Appointment" className="rounded-3xl" bodyClassName="space-y-0">
                  <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.7) }}>
                    {new Intl.DateTimeFormat('en-IE', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(nextAppointment.date))}
                  </p>
                  <p className="font-medium">
                    {nextAppointment.startTime} - {nextAppointment.endTime}
                  </p>
                  <p className="text-sm">{nextAppointment.type === 'online' ? 'Online' : 'In-person'}</p>
                  <button
                    type="button"
                    onClick={() => {
                      const rawDate = String(nextAppointment.date || '');
                      const appointmentDate = rawDate.includes('T') ? rawDate.slice(0, 10) : rawDate;
                      const dateParam = encodeURIComponent(appointmentDate);

                      navigate(`/calendar?view=timeGridWeek&date=${dateParam}`);
                    }}
                    className="mt-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                    style={{ backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.16), color: theme.colors.primary.darker }}
                  >
                    View in Calendar
                  </button>
                </SectionCard>
              )}
            </div>

            {/* Right column - Tabs and History */}
            <div className="space-y-4">
              <SectionCard title="Client Information" className="rounded-3xl" bodyClassName="space-y-0">
                {/* Tabs */}
                <div className="mb-6 flex gap-6 border-b" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9) }}>
                  {[
                    { id: 'notes', label: 'Notes' },
                    { id: 'files', label: 'Files' },
                    { id: 'appointments', label: 'Appointments' },
                    { id: 'payments', label: 'Payments' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (tab.id === 'files') {
                          setShowNoteSavedPopup(false);
                        }
                      }}
                      className="pb-3 text-sm font-medium transition-colors"
                      style={{
                        color: activeTab === tab.id ? theme.colors.secondary.charcoal : withAlpha(theme.colors.secondary.charcoal, 0.5),
                        borderBottom: activeTab === tab.id ? `2px solid ${theme.colors.primary.DEFAULT}` : 'none',
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {showNoteSavedPopup && activeTab !== 'files' && (
                  <div className="mb-5 rounded-2xl px-4 pb-3 pt-2" style={{ backgroundColor: withAlpha(theme.colors.secondary.sage, 0.55), border: `1px solid ${withAlpha(theme.colors.primary.DEFAULT, 0.3)}` }}>
                    <div className="mb-1 h-0 w-0" style={{ borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: `10px solid ${withAlpha(theme.colors.secondary.sage, 0.55)}` }} />
                    <p className="text-sm font-semibold" style={{ color: theme.colors.primary.darker }}>
                      Your note is saved.
                    </p>
                    <p className="mt-1 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.78) }}>
                      You can view it under the Files tab.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('files');
                          setShowNoteSavedPopup(false);
                        }}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                        style={{ backgroundColor: theme.colors.primary.DEFAULT, color: theme.colors.gray[50] }}
                      >
                        Go to Files
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNoteSavedPopup(false)}
                        className="rounded-xl px-3 py-1.5 text-xs font-semibold"
                        style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.75), color: theme.colors.secondary.charcoal }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab Content */}
                {activeTab === 'notes' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={startNewNote}
                        className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold"
                        style={{ backgroundColor: withAlpha(theme.colors.secondary.sage, 0.3), color: theme.colors.primary.darker }}
                      >
                        + New Session Note
                      </button>
                      {isNoteEditorOpen && (
                        <>
                          <button
                            type="button"
                            onClick={() => saveCurrentNote({ auto: false })}
                            disabled={noteBusy || !canSaveNote}
                            className="rounded-2xl px-4 py-2 text-sm font-semibold"
                            style={{
                              backgroundColor: noteBusy || !canSaveNote
                                ? withAlpha(theme.colors.secondary.beige, 0.8)
                                : theme.colors.primary.DEFAULT,
                              color: noteBusy || !canSaveNote
                                ? withAlpha(theme.colors.secondary.charcoal, 0.6)
                                : theme.colors.gray[50],
                            }}
                          >
                            {noteBusy ? 'Saving...' : 'Save Note'}
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelNoteEdit}
                            className="rounded-2xl px-4 py-2 text-sm font-semibold"
                            style={{
                              backgroundColor: withAlpha(theme.colors.secondary.beige, 0.6),
                              color: theme.colors.secondary.charcoal,
                            }}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {noteStatusMessage && (
                        <span className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.65) }}>
                          {noteStatusMessage}
                        </span>
                      )}
                    </div>

                    <div className="mt-4">
                      <p
                        className="mb-3 text-sm"
                        style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6) }}
                      >
                        Create with Template
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {['SOAP', 'DAP', 'BIRP', 'PIP'].map((template) => (
                          <button
                            key={template}
                            type="button"
                            onClick={() => handleTemplateSelect(template)}
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: selectedTemplate === template
                                ? theme.colors.primary.DEFAULT
                                : withAlpha(theme.colors.primary.light, 0.6),
                              color: theme.colors.gray[50],
                            }}
                          >
                            {template}
                          </button>
                        ))}
                      </div>
                    </div>

                    {isNoteEditorOpen ? (
                      <>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                            Appointment
                          </span>
                          <select
                            value={selectedAppointmentId}
                            onChange={(event) => setSelectedAppointmentId(event.target.value)}
                            className="w-full rounded-xl border bg-white px-3 py-2 text-sm"
                            style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                          >
                            <option value="">Select linked appointment</option>
                            {[...appointments]
                              .sort((a, b) => new Date(b.date) - new Date(a.date))
                              .map((appointment) => (
                                <option key={appointment.id || appointment._id} value={appointment.id || appointment._id}>
                                  {new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(appointment.date))}
                                  {' '}• {appointment.startTime || 'No time'}
                                </option>
                              ))}
                          </select>
                        </label>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em]" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                            Note Content
                          </label>
                          <textarea
                            value={noteContent}
                            onChange={(event) => setNoteContent(event.target.value)}
                            rows={10}
                            placeholder="Write session note..."
                            className="w-full rounded-2xl border bg-white px-4 py-3 text-sm outline-none"
                            style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                        Start a new note or select a template to open the editor.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'files' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={handleOpenFilePicker}
                        disabled={fileUploadBusy}
                        className="rounded-2xl px-4 py-2 text-sm font-semibold"
                        style={{
                          backgroundColor: fileUploadBusy ? withAlpha(theme.colors.secondary.beige, 0.8) : theme.colors.primary.DEFAULT,
                          color: fileUploadBusy ? withAlpha(theme.colors.secondary.charcoal, 0.6) : theme.colors.gray[50],
                        }}
                      >
                        {fileUploadBusy ? 'Uploading...' : 'Upload File'}
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleUploadFile}
                      />
                      {fileStatusMessage && (
                        <span className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.65) }}>
                          {fileStatusMessage}
                        </span>
                      )}
                    </div>

                    {files.length > 0 ? (
                      displayedFiles.map((file) => (
                        <div
                          key={file._id || file.id}
                          className="flex w-full items-center gap-3 rounded-2xl p-3"
                          style={{ backgroundColor: withAlpha(theme.colors.secondary.cream, 0.8) }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenFile(file)}
                            className="flex flex-1 items-center gap-3 text-left"
                            style={{ color: theme.colors.secondary.charcoal }}
                          >
                            <div
                              className="h-10 w-10 rounded flex items-center justify-center"
                              style={{ backgroundColor: theme.colors.error.bg, color: theme.colors.error.text }}
                            >
                              {isImageFile(file) ? (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                                  <rect x="3" y="5" width="18" height="14" rx="2" />
                                  <circle cx="9" cy="10" r="1.5" />
                                  <path d="m21 16-5-5-4 4-2-2-4 3" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                                  <path d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                                  <path d="M14 2v6h6" />
                                  <path d="M9 13h6" />
                                  <path d="M9 17h6" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{file.fileName || file.name || 'Document'}</p>
                              <p className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.55) }}>
                                {new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(file.uploadedAt || file.createdAt || new Date()))}
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file._id || file.id)}
                            disabled={fileBusyId === (file._id || file.id)}
                            className="rounded-lg p-2"
                            title="Delete file"
                            aria-label="Delete file"
                            style={{
                              color: theme.colors.error.text,
                              opacity: fileBusyId === (file._id || file.id) ? 0.5 : 1,
                            }}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                        No files yet.
                      </p>
                    )}

                    {files.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllFiles((current) => !current)}
                        className="text-sm font-semibold"
                        style={{ color: theme.colors.primary.DEFAULT }}
                      >
                        {showAllFiles ? 'Show less' : `Show more (${files.length - 3})`}
                      </button>
                    )}

                    <div className="pt-2">
                      <h4 className="mb-3 text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                        Notes
                      </h4>
                      {notesSorted.length > 0 ? (
                        <div className="space-y-2">
                          {notesSorted.map((note) => {
                            const noteId = note.id || note._id;
                            const isActive = noteId === editingNoteId;

                            return (
                              <div
                                key={noteId}
                                className="rounded-2xl border px-3 py-3"
                                style={{
                                  borderColor: isActive
                                    ? withAlpha(theme.colors.primary.DEFAULT, 0.75)
                                    : withAlpha(theme.colors.secondary.beige, 0.85),
                                  backgroundColor: isActive
                                    ? withAlpha(theme.colors.secondary.sage, 0.14)
                                    : withAlpha(theme.colors.gray[50], 0.96),
                                }}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setViewingNote(note)}
                                    className="flex-1 text-left"
                                    style={{ color: theme.colors.secondary.charcoal }}
                                  >
                                    <p className="text-sm font-semibold">
                                      {new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(note.createdAt || new Date()))}
                                    </p>
                                    <p className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.64) }}>
                                      {note.templateType || 'Note'}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.78) }}>
                                      {note.content || 'No content'}
                                    </p>
                                    <p className="mt-2 text-xs font-semibold" style={{ color: theme.colors.primary.DEFAULT }}>
                                      Click to read full note
                                    </p>
                                  </button>
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setActiveTab('notes');
                                        handleEditNote(note);
                                      }}
                                      className="rounded-lg p-2"
                                      title="Edit note"
                                      aria-label="Edit note"
                                      style={{ color: theme.colors.primary.DEFAULT }}
                                    >
                                      <EditIcon />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteNote(noteId)}
                                      className="rounded-lg p-2"
                                      title="Delete note"
                                      aria-label="Delete note"
                                      style={{ color: theme.colors.error.text }}
                                    >
                                      <TrashIcon />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                          No notes yet.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'appointments' && (
                  <div className="space-y-3">
                    {appointments.length > 0 ? (
                      [...appointments].sort((a, b) => new Date(b.date) - new Date(a.date)).map((appointment) => (
                        <div key={appointment._id || appointment.id} className="rounded-2xl p-3" style={{ backgroundColor: withAlpha(theme.colors.secondary.cream, 0.8) }}>
                          <p className="text-sm font-medium">
                            {new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(appointment.date))}
                            {' '}
                            at
                            {' '}
                            {appointment.startTime}
                          </p>
                          <p className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.65) }}>
                            {appointment.type === 'online' ? 'Online' : 'In-person'} • {appointment.status}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                        No appointments yet.
                      </p>
                    )}
                  </div>
                )}

                {activeTab === 'payments' && (
                  <div className="space-y-3">
                    {payments.length > 0 ? (
                      payments.map((payment) => {
                        const paymentDate = new Date(payment.createdAt || payment.updatedAt || new Date());
                        const hasDate = !Number.isNaN(paymentDate.getTime());
                        const normalizedStatus = String(payment.status || 'pending').toLowerCase();

                        const statusStyle = normalizedStatus === 'paid'
                          ? {
                            backgroundColor: withAlpha(theme.colors.secondary.sage, 0.95),
                            color: theme.colors.primary.darker,
                          }
                          : normalizedStatus === 'failed'
                            ? {
                              backgroundColor: withAlpha(theme.colors.error.bg, 0.95),
                              color: theme.colors.error.text,
                            }
                            : {
                              backgroundColor: withAlpha(theme.colors.primary.lighter, 0.45),
                              color: theme.colors.primary.darker,
                            };

                        return (
                          <div key={payment.id || payment._id} className="rounded-2xl p-3" style={{ backgroundColor: withAlpha(theme.colors.secondary.cream, 0.8) }}>
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                                  {formatCurrency(payment.amount)}
                                </p>
                                <p className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.65) }}>
                                  {hasDate
                                    ? new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(paymentDate)
                                    : 'Unknown date'}
                                </p>
                                {payment.appointment?.date && (
                                  <p className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.65) }}>
                                    Session: {new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(payment.appointment.date))}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="rounded-full px-2.5 py-1 text-xs font-semibold capitalize" style={statusStyle}>
                                  {normalizedStatus}
                                </span>
                                {payment.receiptURL && (
                                  <a
                                    href={payment.receiptURL}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg px-2.5 py-1 text-xs font-semibold"
                                    style={{
                                      backgroundColor: withAlpha(theme.colors.primary.DEFAULT, 0.12),
                                      color: theme.colors.primary.darker,
                                    }}
                                  >
                                    View Receipt
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                        No payment history yet.
                      </p>
                    )}
                  </div>
                )}
              </SectionCard>

              <FormModal
                isOpen={Boolean(viewingNote)}
                title="View Note"
                onClose={() => setViewingNote(null)}
                maxWidthClass="max-w-2xl"
              >
                <div className="mb-4 border-b pb-4" style={{ borderColor: withAlpha(theme.colors.secondary.beige, 0.9) }}>
                  <p className="text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                    {new Intl.DateTimeFormat('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(viewingNote?.createdAt || new Date()))}
                  </p>
                  <p className="text-xs" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.64) }}>
                    {viewingNote?.templateType || 'Note'}
                  </p>
                </div>
                <div className="max-h-[65vh] overflow-y-auto">
                  <p className="whitespace-pre-wrap text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.86) }}>
                    {viewingNote?.content || 'No content'}
                  </p>
                </div>
              </FormModal>

              <div className="rounded-3xl p-6" style={componentStyles.card}>
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold" style={componentStyles.sectionTitle}>History</h3>
                  <div className="inline-flex rounded-xl p-1" style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.6) }}>
                    <button
                      type="button"
                      onClick={() => setHistorySortOrder('newest')}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: historySortOrder === 'newest' ? theme.colors.gray[50] : 'transparent',
                        color: theme.colors.secondary.charcoal,
                      }}
                    >
                      Newest first
                    </button>
                    <button
                      type="button"
                      onClick={() => setHistorySortOrder('oldest')}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold"
                      style={{
                        backgroundColor: historySortOrder === 'oldest' ? theme.colors.gray[50] : 'transparent',
                        color: theme.colors.secondary.charcoal,
                      }}
                    >
                      Oldest first
                    </button>
                  </div>
                </div>
                <div className="max-h-[28rem] overflow-y-auto pr-1">
                  {orderedHistoryItems.length > 0 ? (
                    <div className="space-y-4">
                      {orderedHistoryItems.map((item, index) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span
                              className="mt-1 h-2.5 w-2.5 rounded-full"
                              style={{ border: `2px solid ${theme.colors.secondary.charcoal}`, backgroundColor: theme.colors.gray[50] }}
                            />
                            {index < orderedHistoryItems.length - 1 && (
                              <span className="mt-1 h-full w-px" style={{ backgroundColor: withAlpha(theme.colors.secondary.charcoal, 0.3), minHeight: '34px' }} />
                            )}
                          </div>
                          <div className="pb-2">
                            <p className="text-sm font-semibold" style={{ color: theme.colors.secondary.charcoal }}>
                              {formatShortDate(item.date)}
                            </p>
                            <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.86) }}>{item.title}</p>
                            <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.72) }}>{item.subtitle}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.58) }}>
                      No history yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <FormModal
        isOpen={showEditClientModal}
        title="Edit Client"
        onClose={closeEditClientModal}
        closeDisabled={editClientBusy}
      >
        <form className="space-y-4" onSubmit={handleSaveClientDetails}>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                    First Name <span style={{ color: theme.colors.error.text }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editClientForm.firstName}
                    onChange={(event) => setEditClientForm((current) => ({ ...current, firstName: event.target.value }))}
                    placeholder="First name"
                    required
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                    Last Name <span style={{ color: theme.colors.error.text }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={editClientForm.lastName}
                    onChange={(event) => setEditClientForm((current) => ({ ...current, lastName: event.target.value }))}
                    placeholder="Last name"
                    required
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                  Email <span style={{ color: theme.colors.error.text }}>*</span>
                </label>
                <input
                  type="email"
                  value={editClientForm.email}
                  onChange={(event) => setEditClientForm((current) => ({ ...current, email: event.target.value }))}
                  required
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                  Phone <span style={{ color: theme.colors.error.text }}>*</span>
                </label>
                <input
                  type="tel"
                  value={editClientForm.phone}
                  onChange={(event) => setEditClientForm((current) => ({ ...current, phone: event.target.value }))}
                  required
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                  Date of Birth <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="date"
                  value={editClientForm.dateOfBirth}
                  onChange={(event) => setEditClientForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                  Address <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  type="text"
                  value={editClientForm.address}
                  onChange={(event) => setEditClientForm((current) => ({ ...current, address: event.target.value }))}
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                  Profile Notes <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
                </label>
                <textarea
                  value={editClientForm.profileNotes}
                  onChange={(event) => setEditClientForm((current) => ({ ...current, profileNotes: event.target.value }))}
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                  style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                    Emergency Contact Name <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editClientForm.emergencyContactName}
                    onChange={(event) => setEditClientForm((current) => ({ ...current, emergencyContactName: event.target.value }))}
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium" style={{ color: theme.colors.secondary.charcoal }}>
                    Emergency Contact Phone <span style={{ color: withAlpha(theme.colors.secondary.charcoal, 0.6), fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={editClientForm.emergencyContactPhone}
                    onChange={(event) => setEditClientForm((current) => ({ ...current, emergencyContactPhone: event.target.value }))}
                    className="w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none"
                    style={{ borderColor: componentStyles.border, color: theme.colors.secondary.charcoal }}
                  />
                </div>
              </div>

              {editClientMessage && (
                <div
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{
                    backgroundColor: withAlpha(theme.colors.error.bg, 0.9),
                    border: `1px solid ${theme.colors.error.border}`,
                    color: theme.colors.error.text,
                  }}
                >
                  {editClientMessage}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEditClientModal}
                  disabled={editClientBusy}
                  className="rounded-xl px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: withAlpha(theme.colors.secondary.beige, 0.7), color: theme.colors.secondary.charcoal }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editClientBusy}
                  className="rounded-xl px-4 py-2 text-sm font-semibold"
                  style={{
                    backgroundColor: editClientBusy ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
                    color: theme.colors.gray[50],
                  }}
                >
                  {editClientBusy ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
        </form>
      </FormModal>

      <ConfirmModal
        isOpen={showDeleteClientModal}
        title="Delete Client"
        description={`This action cannot be undone. Are you sure you want to delete ${clientName}?`}
        errorMessage={deleteClientMessage}
        onCancel={closeDeleteClientModal}
        onConfirm={handleDeleteClient}
        isBusy={deleteClientBusy}
        confirmLabel="Delete Client"
      />

      <ConfirmModal
        isOpen={showDeleteNoteModal}
        title="Delete Note"
        description="This action cannot be undone. Are you sure you want to delete this note?"
        errorMessage={deleteNoteMessage}
        onCancel={closeDeleteNoteModal}
        onConfirm={handleConfirmDeleteNote}
        isBusy={deleteNoteBusy}
        confirmLabel="Delete Note"
      />

      <ConfirmModal
        isOpen={showDeleteFileModal}
        title="Delete File"
        description="This action cannot be undone. Are you sure you want to delete this file?"
        errorMessage={deleteFileMessage}
        onCancel={closeDeleteFileModal}
        onConfirm={handleConfirmDeleteFile}
        isBusy={deleteFileBusy}
        confirmLabel="Delete File"
      />
    </div>
  );
}
