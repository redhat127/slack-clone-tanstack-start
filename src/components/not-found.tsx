import { useNavigate } from '@tanstack/react-router'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export const NotFound = () => {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <Card className="max-w-sm mx-auto w-full text-center gap-2">
        <CardHeader>
          <CardTitle>
            <h1 className="font-bold text-2xl text-red-600">404 - Not Found</h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Sorry, we couldn't find the page you're looking for. It may have
            been moved or deleted.
          </p>
          <Button
            className="mt-4 w-full"
            onClick={() => {
              navigate({ to: '/workspace' })
            }}
          >
            Back to Your Workspaces
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
