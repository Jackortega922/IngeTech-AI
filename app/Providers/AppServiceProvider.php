<?php

namespace App\Providers;

use App\Services\Recommender\CliRecommenderClient;
use App\Services\Recommender\HttpRecommenderClient;
use App\Services\Recommender\MockRecommenderClient;
use App\Services\Recommender\RecommenderClient;
use Illuminate\Support\ServiceProvider;

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
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
