export function bindImageErrors(scope = document) {
  scope.querySelectorAll('img[data-image-fallback]').forEach(image => {
    image.addEventListener('error', () => {
      if (image.classList.contains('cover-animated') && image.closest('.collection-card')) {
        image.closest('.collection-card')?.classList.remove('cover-playing');
        image.remove();
        return;
      }
      if (image.classList.contains('asset-animated')) {
        image.closest('.asset-card')?.classList.remove('asset-playing');
        image.remove();
        return;
      }
      image.closest('.asset-thumb, .collection-cover, .modal-preview, .route-hero')?.classList.add('image-error');
      image.remove();
    }, { once: true });
  });
}
