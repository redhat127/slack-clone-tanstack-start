import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Button } from '../ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card'

export const AuthLayout = ({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) => {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-screen p-8">
      <Card className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>
            <h1 className="font-bold">{title}</h1>
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
      <Button asChild variant="link" className="underline">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
  )
}
