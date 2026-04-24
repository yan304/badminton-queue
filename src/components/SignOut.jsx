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

export default function SignOut({
  signOut,
  onOpenPendingPool,
  pendingPoolCount = 0,
}) {
  const dialogRef = useRef(null);
  const open = useCallback(() => dialogRef.current?.showModal(), []);
  const close = useCallback(() => dialogRef.current?.close(), []);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex items-center gap-3">
        {typeof onOpenPendingPool === "function" ? (
          <button
            type="button"
            onClick={onOpenPendingPool}
            title="Pending pool"
            className="relative flex h-14 w-14 items-center justify-center rounded-full border border-emerald-900/20 bg-[#f4eedf] text-emerald-900 shadow-[0_8px_30px_rgba(22,51,41,0.22)] transition hover:bg-[#ece3ce] active:scale-95"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M3.5 3A1.5 1.5 0 0 0 2 4.5v2A1.5 1.5 0 0 0 3.5 8h13A1.5 1.5 0 0 0 18 6.5v-2A1.5 1.5 0 0 0 16.5 3h-13ZM2 10.5A1.5 1.5 0 0 1 3.5 9h13a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 2 12.5v-2ZM3.5 15A1.5 1.5 0 0 0 2 16.5v0A1.5 1.5 0 0 0 3.5 18h13a1.5 1.5 0 0 0 1.5-1.5v0a1.5 1.5 0 0 0-1.5-1.5h-13Z" />
            </svg>
            <span className="absolute -right-1 -top-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-950">
              {pendingPoolCount}
            </span>
          </button>
        ) : null}

        <button
          type="button"
          onClick={open}
          title="Sign out"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-900 text-white shadow-[0_8px_30px_rgba(22,51,41,0.35)] transition hover:bg-emerald-800 active:scale-95"
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
      </div>

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
