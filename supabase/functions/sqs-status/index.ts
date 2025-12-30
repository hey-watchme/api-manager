// SQS Status Monitoring Edge Function
import { SQSClient, GetQueueAttributesCommand } from "npm:@aws-sdk/client-sqs@3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface QueueStatus {
  name: string
  available: number
  inflight: number
}

interface DLQStatus {
  name: string
  messages: number
}

interface DashboardQueueStatus {
  available: number
  inflight: number
}

Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize SQS Client with credentials from environment variables
    const sqsClient = new SQSClient({
      region: Deno.env.get('AWS_REGION') || 'ap-southeast-2',
      credentials: {
        accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    })

    // Queue URLs
    const queues = {
      'ASR': 'https://sqs.ap-southeast-2.amazonaws.com/754724220380/watchme-asr-queue-v2.fifo',
      'SED': 'https://sqs.ap-southeast-2.amazonaws.com/754724220380/watchme-sed-queue-v2.fifo',
      'SER': 'https://sqs.ap-southeast-2.amazonaws.com/754724220380/watchme-ser-queue-v2.fifo',
    }

    const dlqs = {
      'ASR-DLQ': 'https://sqs.ap-southeast-2.amazonaws.com/754724220380/watchme-asr-dlq-v2.fifo',
      'SED-DLQ': 'https://sqs.ap-southeast-2.amazonaws.com/754724220380/watchme-sed-dlq-v2.fifo',
      'SER-DLQ': 'https://sqs.ap-southeast-2.amazonaws.com/754724220380/watchme-ser-dlq-v2.fifo',
    }

    const dashboardQueues = {
      'summary': 'https://sqs.ap-southeast-2.amazonaws.com/754724220380/watchme-dashboard-summary-queue',
      'analysis': 'https://sqs.ap-southeast-2.amazonaws.com/754724220380/watchme-dashboard-analysis-queue',
    }

    // Get queue attributes
    const queueStatus: QueueStatus[] = []
    for (const [name, url] of Object.entries(queues)) {
      const command = new GetQueueAttributesCommand({
        QueueUrl: url,
        AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible'],
      })
      const response = await sqsClient.send(command)

      queueStatus.push({
        name,
        available: parseInt(response.Attributes?.ApproximateNumberOfMessages || '0'),
        inflight: parseInt(response.Attributes?.ApproximateNumberOfMessagesNotVisible || '0'),
      })
    }

    // Get DLQ attributes
    const dlqStatus: DLQStatus[] = []
    for (const [name, url] of Object.entries(dlqs)) {
      const command = new GetQueueAttributesCommand({
        QueueUrl: url,
        AttributeNames: ['ApproximateNumberOfMessages'],
      })
      const response = await sqsClient.send(command)

      dlqStatus.push({
        name,
        messages: parseInt(response.Attributes?.ApproximateNumberOfMessages || '0'),
      })
    }

    // Get dashboard queue attributes
    const dashboardStatus: Record<string, DashboardQueueStatus> = {}
    for (const [name, url] of Object.entries(dashboardQueues)) {
      const command = new GetQueueAttributesCommand({
        QueueUrl: url,
        AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible'],
      })
      const response = await sqsClient.send(command)

      dashboardStatus[name] = {
        available: parseInt(response.Attributes?.ApproximateNumberOfMessages || '0'),
        inflight: parseInt(response.Attributes?.ApproximateNumberOfMessagesNotVisible || '0'),
      }
    }

    // Return response
    const data = {
      queues: queueStatus,
      dlqs: dlqStatus,
      dashboard_queue: dashboardStatus,
      timestamp: new Date().toISOString(),
    }

    return new Response(
      JSON.stringify(data),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('SQS status error:', error)

    return new Response(
      JSON.stringify({
        error: 'SQS status fetch failed',
        message: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
