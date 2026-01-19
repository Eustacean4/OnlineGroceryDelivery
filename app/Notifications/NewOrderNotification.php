<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Order;

class NewOrderNotification extends Notification
{
    use Queueable;

    protected $order;

    public function __construct(Order $order)
    {
        $this->order = $order;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toArray($notifiable)
    {
        return [
            'title' => 'New Order Received',
            'message' => "New order #{$this->order->id} from {$this->order->user->name}",
            'order_id' => $this->order->id,
            'customer_name' => $this->order->user->name,
            'total' => $this->order->total,
            'items_count' => $this->order->items->count(),
            'created_at' => $this->order->created_at->format('Y-m-d H:i:s')
        ];
    }
}