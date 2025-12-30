#!/bin/bash
# SQS Queue Monitoring Script

set -e

REGION="ap-southeast-2"
ACCOUNT_ID="754724220380"

echo "🔍 WatchMe SQS Queue Monitor"
echo "=============================="
echo ""

# Main Queues (FIFO)
echo "📬 メインキュー（FIFO）"
echo "----------------------"
for queue in watchme-asr-queue-v2.fifo watchme-sed-queue-v2.fifo watchme-ser-queue-v2.fifo; do
  echo ""
  echo "Queue: $queue"
  aws sqs get-queue-attributes \
    --queue-url "https://sqs.$REGION.amazonaws.com/$ACCOUNT_ID/$queue" \
    --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
    --region $REGION \
    --query 'Attributes.{Available:ApproximateNumberOfMessages,InFlight:ApproximateNumberOfMessagesNotVisible}' \
    --output table
done

# Dead Letter Queues
echo ""
echo "☠️  デッドレターキュー（DLQ）"
echo "----------------------------"
for queue in watchme-asr-dlq-v2.fifo watchme-sed-dlq-v2.fifo watchme-ser-dlq-v2.fifo; do
  echo ""
  messages=$(aws sqs get-queue-attributes \
    --queue-url "https://sqs.$REGION.amazonaws.com/$ACCOUNT_ID/$queue" \
    --attribute-names ApproximateNumberOfMessages \
    --region $REGION \
    --query 'Attributes.ApproximateNumberOfMessages' \
    --output text)

  if [ "$messages" -gt 0 ]; then
    echo "⚠️  $queue: $messages messages (要確認)"
  else
    echo "✅ $queue: 0 messages"
  fi
done

# Dashboard Queues
echo ""
echo "📋 ダッシュボードキュー"
echo "----------------------"
for queue in watchme-dashboard-summary-queue watchme-dashboard-analysis-queue; do
  echo ""
  echo "Queue: $queue"
  aws sqs get-queue-attributes \
    --queue-url "https://sqs.$REGION.amazonaws.com/$ACCOUNT_ID/$queue" \
    --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
    --region $REGION \
    --query 'Attributes.{Available:ApproximateNumberOfMessages,InFlight:ApproximateNumberOfMessagesNotVisible}' \
    --output table
done

echo ""
echo "✅ 完了"
