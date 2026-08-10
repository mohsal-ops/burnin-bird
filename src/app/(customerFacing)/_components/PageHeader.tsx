import { ReactNode } from "react"

export default function PageHeader({ children }: { children: ReactNode }) {
    return <h1 className="text-4xl font-bold tracking-tight  ">{children}</h1>
}
