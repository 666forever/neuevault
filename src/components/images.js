export function bindImageErrors(scope = document) {
  scope.querySelectorAll('img[data-image-fallback]').forEach(image => {
    image.addEventListener('error', () => {
      image.closest('.asset-thumb, .collection-cover, .modal-preview, .route-hero')?.classList.add('image-error');
      image.remove();
    }, { once: true });
  });
}
