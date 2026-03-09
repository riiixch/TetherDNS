export default defineAppConfig({
    ui: {
        primary: 'blue',
        gray: 'slate',
        card: {
            slots: {
                root: 'bg-white dark:bg-slate-900/80 backdrop-blur-md ring-1 ring-slate-200 dark:ring-slate-800 shadow-sm dark:shadow-none'
            }
        },
        table: {
            slots: {
                th: 'text-slate-900 dark:text-white font-semibold',
                td: 'text-slate-600 dark:text-slate-400 font-mono'
            }
        }
    }
})
