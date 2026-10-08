<?php

namespace App\Providers;

use App\Services\Recommender\AfinidadLaptops;
use App\Services\Recommender\CliRecommenderClient;
use App\Services\Recommender\HttpRecommenderClient;
use App\Services\Recommender\MockRecommenderClient;
use App\Services\Recommender\RecommenderClient;
use App\Services\Recommender\SegmentadorClientes;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mailer\Bridge\Brevo\Transport\BrevoTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(RecommenderClient::class, function () {
            return match (config('recommender.mode')) {
                'cli' => new CliRecommenderClient,
                'mock' => new MockRecommenderClient,
                default => new HttpRecommenderClient,
            };
        });

        // Segmentación de clientes (Marketing): mismo motor y mismo modo que la recomendación.
        $this->app->bind(SegmentadorClientes::class, function () {
            return match (config('recommender.mode')) {
                'cli' => new CliRecommenderClient,
                'mock' => new MockRecommenderClient,
                default => new HttpRecommenderClient,
            };
        });

        // "Para ti" del comparador: afinidad con el cuestionario, mismo motor y mismo modo.
        $this->app->bind(AfinidadLaptops::class, function () {
            return match (config('recommender.mode')) {
                'cli' => new CliRecommenderClient,
                'mock' => new MockRecommenderClient,
                default => new HttpRecommenderClient,
            };
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // MAIL_MAILER=brevo: envía por la API HTTPS de Brevo (ADR 0007), que sí funciona en el
        // plan gratuito de Render, donde SMTP está bloqueado.
        Mail::extend('brevo', fn () => (new BrevoTransportFactory)->create(
            new Dsn('brevo+api', 'default', config('services.brevo.key'))
        ));
    }
}
