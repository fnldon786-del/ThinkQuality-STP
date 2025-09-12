"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock, User } from "lucide-react"
import { format } from "date-fns"

interface SignatureData {
  id: string
  signature_data: string
  signer_name: string
  signer_role: string
  signature_type: string
  signed_at: string
  notes?: string
}

interface SignatureDisplayProps {
  signatures: SignatureData[]
  title?: string
  showType?: boolean
}

export function SignatureDisplay({ signatures, title = "Signatures", showType = true }: SignatureDisplayProps) {
  if (signatures.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No signatures yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {signatures.map((signature) => (
          <div key={signature.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="font-medium">{signature.signer_name}</span>
                <Badge variant="secondary">{signature.signer_role}</Badge>
              </div>
              {showType && (
                <Badge variant="outline">
                  {signature.signature_type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1">
                <img
                  src={signature.signature_data || "/placeholder.svg"}
                  alt={`Signature by ${signature.signer_name}`}
                  className="max-w-full h-16 border rounded bg-white object-contain"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(signature.signed_at), "MMM d, yyyy 'at' h:mm a")}
              </div>
            </div>

            {signature.notes && (
              <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                <strong>Notes:</strong> {signature.notes}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
