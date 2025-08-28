"use client"

import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Footer } from "@/components/footer"
import { ArrowLeft, FileText, Clock, AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface Machine {
  id: string
  name: string
  machine_number: string
  model: string
}

interface SOP {
  id: string
  title: string
  category: string
  difficulty_level: string
  estimated_duration: number
  safety_requirements: string[]
  equipment_types: string[]
}

export default function MachineSOPsPage() {
  const params = useParams()
  const qrCode = params.qrCode as string
  const [machine, setMachine] = useState<Machine | null>(null)
  const [sops, setSops] = useState<SOP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [qrCode])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load machine details
      const { data: machineData, error: machineError } = await supabase
        .from("machines")
        .select("id, name, machine_number, model")
        .eq("qr_code", qrCode)
        .single()

      if (machineError) throw machineError
      setMachine(machineData)

      // Load relevant SOPs
      const { data: sopsData, error: sopsError } = await supabase
        .from("sops")
        .select("*")
        .contains("equipment_types", [machineData.model])
        .eq("status", "published")
        .order("title")

      if (sopsError) throw sopsError
      setSops(sopsData || [])
    } catch (error: unknown) {
      console.error("Error loading data:", error)
      setError(error instanceof Error ? error.message : "Failed to load data")
    } finally {
      setIsLoading(false)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-100 text-green-800"
      case "Intermediate":
        return "bg-yellow-100 text-yellow-800"
      case "Advanced":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !machine) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-card shadow-sm p-4">
          <Logo size="md" showText={true} />
        </header>
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground">{error || "Machine not found"}</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-card shadow-sm p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/machine/${qrCode}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <Logo size="md" showText={true} />
        </div>
      </header>

      <main className="flex-1 p-4 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Standard Operating Procedures</h1>
            <p className="text-muted-foreground mt-2">
              {machine.name} ({machine.machine_number})
            </p>
          </div>

          {sops.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No SOPs Available</h3>
                <p className="text-muted-foreground">
                  No Standard Operating Procedures are currently available for this machine model.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sops.map((sop) => (
                <Card key={sop.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{sop.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{sop.category}</p>
                      </div>
                      <Badge className={getDifficultyColor(sop.difficulty_level)}>{sop.difficulty_level}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{sop.estimated_duration} minutes</span>
                    </div>

                    {sop.safety_requirements && sop.safety_requirements.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          Safety Requirements
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {sop.safety_requirements.slice(0, 3).map((req, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                          {sop.safety_requirements.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{sop.safety_requirements.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    <Button className="w-full" asChild>
                      <Link href={`/machine/${qrCode}/sops/${sop.id}`}>View Procedure</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
