import { useCallback, useRef } from "react";

const logoutIcon = (
  <>
    <path
      fillRule="evenodd"
      d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
      clipRule="evenodd"
    />
    <path
      fillRule="evenodd"
      d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
      clipRule="evenodd"
    />
  </>
);

export default function SignOut({ signOut }) {
  const dialogRef = useRef(null);
  const open = useCallback(() => dialogRef.current?.showModal(), []);
  const close = useCallback(() => dialogRef.current?.close(), []);

  return (
    <>
      <button
        type="button"
        onClick={open}
        title="Sign out"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900 text-white shadow-[0_8px_30px_rgba(22,51,41,0.35)] transition hover:bg-emerald-800 active:scale-95"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-5 w-5"
        >
          {logoutIcon}
        </svg>
      </button>

      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 m-auto w-full max-w-xs rounded-[2rem] border border-emerald-900/10 bg-[#f4eedf] p-0 shadow-[0_30px_80px_rgba(22,51,41,0.25)] backdrop:bg-black/40"
      >
        <div className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6"
            >
              {logoutIcon}
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-emerald-950">Sign out?</h3>
          <p className="mt-1 text-sm text-emerald-900/60">
            You&apos;ll need to sign in again to access the dashboard.
          </p>
          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={close}
              className="flex-1 rounded-xl border border-emerald-950/12 py-2.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={signOut}
              className="flex-1 rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"
            >
              Sign out
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
