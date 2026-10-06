"use client";

export function DeleteArticleButton({ action }: { action: (formData: FormData) => void | Promise<void> }) {
  return <form action={action} onSubmit={event => {
    if (!window.confirm("این مقاله حذف شود؟ این عملیات قابل بازگشت نیست.")) event.preventDefault();
  }}>
    <button className="button button-danger" type="submit">حذف مقاله</button>
  </form>;
}
