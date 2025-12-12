#!/bin/bash

# ===================================================
# Cron Schedule Deploy Script for API Manager
# ===================================================
# This script deploys the cron schedule configuration
# from local to EC2 production server
# ===================================================

set -e  # Exit on error

# Configuration
EC2_HOST="3.24.16.82"
EC2_USER="ubuntu"
SSH_KEY="$HOME/watchme-key.pem"
REMOTE_DIR="/home/ubuntu/watchme-api-manager"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}====================================================${NC}"
echo -e "${YELLOW}     Deploying Cron Schedule to EC2 Server         ${NC}"
echo -e "${YELLOW}====================================================${NC}"

# Check if SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $SSH_KEY${NC}"
    echo "Please ensure your SSH key is in the correct location."
    exit 1
fi

# Deploy to EC2
echo -e "\n${GREEN}1. Connecting to EC2 server...${NC}"
echo "   Host: $EC2_HOST"
echo "   User: $EC2_USER"

ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" << 'EOF'
    set -e
    
    # Colors
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    NC='\033[0m'
    
    echo -e "\n${GREEN}2. Updating repository...${NC}"
    cd /home/ubuntu/watchme-api-manager
    git pull origin main
    
    echo -e "\n${GREEN}3. Copying cron file to system...${NC}"
    sudo cp scheduler/watchme-scheduler-cron /etc/cron.d/watchme-scheduler
    sudo chmod 644 /etc/cron.d/watchme-scheduler
    
    echo -e "\n${GREEN}4. Reloading cron service...${NC}"
    sudo systemctl reload cron
    
    echo -e "\n${GREEN}5. Verifying cron configuration...${NC}"
    echo -e "${YELLOW}Current dashboard-related cron jobs:${NC}"
    grep -E "dashboard|Dashboard" /etc/cron.d/watchme-scheduler || echo "No dashboard jobs found"
    
    echo -e "\n${YELLOW}Last 15 lines of cron file:${NC}"
    tail -15 /etc/cron.d/watchme-scheduler
    
    echo -e "\n${GREEN}6. Checking cron service status...${NC}"
    systemctl status cron | head -10
    
    echo -e "\n${GREEN}✅ Cron schedule deployed successfully!${NC}"
    echo -e "${YELLOW}====================================================${NC}"
    echo -e "${YELLOW}Note: dashboard-summary and dashboard-summary-analysis${NC}"
    echo -e "${YELLOW}      have been commented out for event-driven migration${NC}"
    echo -e "${YELLOW}====================================================${NC}"
EOF

echo -e "\n${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${YELLOW}====================================================${NC}"
echo -e "Next steps:"
echo -e "1. Monitor logs: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'tail -f /var/log/scheduler/cron.log'"
echo -e "2. Check cron jobs: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'sudo crontab -l -u ubuntu'"
echo -e "${YELLOW}====================================================${NC}"