<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class CustomResetPassword extends Notification
{
    use Queueable;

    public $token;
    public $email;

    public function __construct($token, $email)
    {
        $this->token = $token;
        $this->email = $email;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        // For mobile app - create deep link
        $mobileUrl = "freshcart://reset-password?token={$this->token}&email=" . urlencode($this->email);
        
        // For web fallback
        $webUrl = "http://localhost:3000/reset-password/{$this->token}?email=" . urlencode($this->email);

        return (new MailMessage)
            ->subject('Reset Your Password - FreshCart')
            ->line('You are receiving this email because we received a password reset request for your account.')
            ->line('**For Mobile App Users:**')
            ->line("Tap this link to reset your password: {$mobileUrl}")
            ->line('**For Web Users:**')
            ->action('Reset Password on Web', $webUrl)
            ->line('This password reset link will expire in 60 minutes.')
            ->line('If you did not request a password reset, no further action is required.');
    }
}