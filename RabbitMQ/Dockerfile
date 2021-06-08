FROM rabbitmq:3.7.18-management
COPY ./*.ez /opt/rabbitmq/plugins/
RUN rabbitmq-plugins enable rabbitmq_message_deduplication