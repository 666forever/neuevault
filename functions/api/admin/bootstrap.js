import { requireAdmin } from '../../../server/admin/authorization.js';
import { adminCapabilities, adminEnvironment, adminProviderCompleteness } from '../../../server/admin/capabilities.js';
import { AdminError, adminJson } from '../../../server/admin/errors.js';
import { requireMethod } from '../../../server/admin/request.js';
import { adminHandler } from '../../../server/admin/response.js';
import { adminGitProvider } from '../../../server/admin/git-provider.js';
import { publicationStore } from '../../../server/admin/publication-store.js';
import { adminCloudinaryProvider } from '../../../server/admin/cloudinary-provider.js';
import { uploadStore } from '../../../server/admin/upload-store.js';

function safeUser(session) {
  const value = session.user || {};
  return { id: String(value.id), displayName: String(value.displayName || 'Discord user').slice(0, 100), avatarUrl: typeof value.avatarUrl === 'string' && value.avatarUrl.startsWith('https://') ? value.avatarUrl : null };
}

export function onRequest(context) {
  const { request, env } = context;
  return adminHandler(request, async requestId => {
    requireMethod(request, ['GET']);
    const admin = await requireAdmin(request, env);
    const environment = adminEnvironment(env);
    if (!environment) throw new AdminError(503, 'admin_environment_unconfigured', 'Administration is unavailable.');
    const completeness=adminProviderCompleteness(context);const publicationConfigured=Boolean(completeness.catalogWrites&&adminGitProvider(context)&&publicationStore(context));
    const uploadConfigured=Boolean(completeness.uploads&&publicationConfigured&&adminCloudinaryProvider(context)&&uploadStore(context));
    const restrictedUploadConfigured=Boolean(completeness.restrictedUploads&&uploadConfigured);
    const capabilities = adminCapabilities(env, { fullyConfigured: publicationConfigured });
    return adminJson({
      authenticated: true,
      role: admin.role,
      user: safeUser(admin.session),
      csrfToken: String(admin.session.csrf || ''),
      environment,
      capabilities: {
        readCatalog: true,
        readDelegatedAdmins: admin.role === 'owner',
        writeCatalog: capabilities.canWrite,
        manageDelegatedAdmins: admin.role === 'owner' && capabilities.canWrite,
        uploadAssets: adminCapabilities(env,{fullyConfigured:uploadConfigured}).canWrite,
        uploadRestrictedAssets: adminCapabilities(env,{fullyConfigured:restrictedUploadConfigured}).canWrite,
        verifyDeployments: completeness.deploymentVerification && environment !== 'preview',
        deleteMedia: false,
      },
      readOnly: !capabilities.canWrite,
      requestId,
    });
  });
}
