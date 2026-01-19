<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class RiderAssignedNotification extends Notification
{
    use Queueable;

    protected $order;

    public function __construct($order)
    {
        $this->order = $order;
    }

    public function via($notifiable)
    {
        return ['database']; // or 'broadcast' if using websockets
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'New Delivery Assignment',
            'message' => 'You have been assigned to deliver Order #' . $this->order->id,
            'order_id' => $this->order->id,
        ];
    }
}
