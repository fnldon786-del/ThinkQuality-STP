"use client"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Placeholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="w-full max-w-xl text-center shadow-xl rounded-2xl">
        <CardHeader>
          <div className="flex flex-col items-center gap-3">
            <Image src="/thinkquality-logo.png" alt="ThinkQuality" width={96} height={96} priority />
            <CardTitle className="text-2xl">{title}</CardTitle>
            {subtitle ? <p className="text-muted-foreground text-sm">{subtitle}</p> : null}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-base">Coming Soon — <span className="font-semibold">Powered by ThinkQuality</span></p>
        </CardContent>
      </Card>
    </div>
  )
}
