export type ErrorFallbackProps = {
  error: Error
  errorCode?: string
}

export function ErrorFallback({ error, errorCode }: ErrorFallbackProps) {
  const handleRefresh = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-full w-full bg-snow dark:bg-dk-snow">
      <div className="flex w-full flex-col items-center justify-center px-4 py-8">
        <div className="flex w-full max-w-md flex-col items-start">
          {/* Header */}
          <div className="@container flex w-full items-start gap-2">
            <span className="font-['Inter'] text-[clamp(2rem,15cqi,4rem)] font-[600] leading-none tracking-tight text-charcoal dark:text-dk-charcoal">
              ERROR
            </span>
          </div>

          {/* Divider lines */}
          <div className="flex w-full flex-col items-center py-2">
            <div className="flex w-full items-center gap-1">
              <div className="flex h-4 max-w-[24px] grow shrink-0 basis-0 flex-col items-start gap-2 bg-crimson" />
              <span className="font-['Inter'] text-[14px] font-[600] leading-[18px] text-crimson">
                OOPS
              </span>
              <div className="flex h-4 grow shrink-0 basis-0 flex-col items-start gap-2 bg-crimson" />
            </div>
          </div>

          {/* Content box */}
          <div className="flex w-full flex-col items-start bg-charcoal dark:bg-dk-charcoal px-1 pt-6 pb-1">
            <div className="flex flex-col items-start bg-snow dark:bg-dk-snow px-2 py-1">
              <span className="font-['Inter'] text-[28px] font-[600] leading-[30px] tracking-tight text-charcoal dark:text-dk-charcoal">
                SOMETHING WENT WRONG
              </span>
            </div>

            <div className="flex w-full flex-col items-start gap-4 bg-snow dark:bg-dk-snow px-2 py-4">
              <span className="font-['Styrene_B_Trial'] text-[14px] font-[400] leading-[20px] text-ash dark:text-dk-ash">
                An unexpected error occurred. Please try refreshing the page or
                go back to the home screen.
              </span>

              {errorCode && (
                <div className="flex items-center gap-2 bg-charcoal dark:bg-dk-charcoal px-2 py-1">
                  <span className="font-['VT323'] text-[16px] font-[400] leading-[18px] text-snow dark:text-dk-snow">
                    ERROR CODE: {errorCode}
                  </span>
                </div>
              )}

              {import.meta.env.DEV && (
                <div className="flex w-full flex-col gap-1 border-l-4 border-crimson bg-crimson/10 px-3 py-2">
                  <span className="font-['Inter'] text-[12px] font-[600] text-crimson">
                    {error.name}
                  </span>
                  <span className="font-['Inter'] text-[12px] font-[400] text-ash dark:text-dk-ash break-all">
                    {error.message}
                  </span>
                </div>
              )}

              {/* Buttons */}
              <div className="flex w-full flex-col gap-2 pt-4">
                <button
                  onClick={handleRefresh}
                  className="flex w-full items-start select-none group relative"
                  type="button"
                >
                  <div className="absolute inset-0 bg-charcoal dark:bg-dk-charcoal opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-20 group-active:opacity-50" />
                  <div className="flex h-8 w-4 flex-none flex-col items-start gap-2 bg-charcoal dark:bg-dk-charcoal" />
                  <div className="flex grow shrink-0 basis-0 items-center justify-between border-2 border-solid border-charcoal dark:border-dk-charcoal px-2 py-2">
                    <span className="font-['Styrene_B_Trial'] text-[18px] font-[500] leading-[22px] text-charcoal dark:text-dk-charcoal">
                      Refresh Page
                    </span>
                    <div className="flex items-end -mb-[1px]">
                      <div className="flex h-0 w-0 flex-none flex-col items-start border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-charcoal dark:border-l-dk-charcoal" />
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleGoHome}
                  className="flex w-full items-start select-none group relative"
                  type="button"
                >
                  <div className="absolute inset-0 bg-charcoal dark:bg-dk-charcoal opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-20 group-active:opacity-50" />
                  <div className="flex h-8 w-4 flex-none flex-col items-start gap-2 bg-ash dark:bg-dk-ash" />
                  <div className="flex grow shrink-0 basis-0 items-center justify-between border-2 border-solid border-ash dark:border-dk-ash px-2 py-2">
                    <span className="font-['Styrene_B_Trial'] text-[18px] font-[500] leading-[22px] text-ash dark:text-dk-ash">
                      Go Home
                    </span>
                    <div className="flex items-end -mb-[1px]">
                      <div className="flex h-0 w-0 flex-none flex-col items-start border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[12px] border-l-ash dark:border-l-dk-ash" />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          {/* <div className="flex w-full items-end justify-center pt-8">
            <div className="flex grow shrink-0 basis-0 flex-col items-center bg-ash dark:bg-dk-ash">
              <div className="flex items-center gap-6 bg-snow dark:bg-dk-snow px-2 py-1">
                <span className="font-['Inter'] text-[12px] font-[600] leading-[16px] text-ash dark:text-dk-ash">
                  SUPPORT
                </span>
              </div>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  )
}
