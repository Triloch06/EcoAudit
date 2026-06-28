"use client";

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LocationCard, LocationData } from './LocationCard';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, Leaf } from 'lucide-react';

interface WasteFormData {
  category: string;
  weight: string;
}

const CATEGORIES = [
  "Plastic",
  "Organic",
  "E-Waste",
  "Glass",
  "Paper",
  "Metal",
  "Other"
];

export const WasteForm = () => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<WasteFormData>();
  const [locationData, setLocationData] = useState<LocationData>({ latitude: null, longitude: null, accuracy: null });
  const [locationStatus, setLocationStatus] = useState<'NOT_CAPTURED' | 'CAPTURED' | 'DENIED' | 'LOADING'>('NOT_CAPTURED');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: WasteFormData) => {
    if (locationStatus !== 'CAPTURED' || !locationData.latitude || !locationData.longitude || !locationData.accuracy) {
      toast.error('Location verification is required before submitting.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await api.post('/logs', {
        category: data.category,
        weight: parseFloat(data.weight),
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        accuracy: locationData.accuracy
      });
      
      toast.success('Waste logged successfully');
      
      // Reset form
      reset();
      setLocationData({ latitude: null, longitude: null, accuracy: null });
      setLocationStatus('NOT_CAPTURED');
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit waste log. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLocationValid = locationStatus === 'CAPTURED';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            Log Waste
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Submit your waste information accurately. We require your physical location to verify the entry.
          </p>
        </div>

        <form id="waste-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Waste Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "Category is required" }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""}>
                      <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                        <SelectValue placeholder="Select waste category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg) <span className="text-red-500">*</span></Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 2.5"
                  className={errors.weight ? "border-red-500" : ""}
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') {
                      e.preventDefault();
                    }
                  }}
                  {...register("weight", { 
                    required: "Weight is required",
                    min: { value: 0.01, message: "Weight must be greater than 0" },
                    validate: (value) => parseFloat(value) > 0 || "Cannot be negative or zero"
                  })}
                />
                {errors.weight && <p className="text-xs text-red-500">{errors.weight.message}</p>}
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      <div className="flex flex-col gap-6">
        <LocationCard 
          onLocationCapture={setLocationData}
          locationStatus={locationStatus}
          setLocationStatus={setLocationStatus}
          accuracy={locationData.accuracy}
          latitude={locationData.latitude}
          longitude={locationData.longitude}
        />
        
        <Card className="glass-card">
          <CardContent className="pt-6">
            <Button 
              type="submit" 
              form="waste-form"
              className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700" 
              disabled={isSubmitting || !isLocationValid}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Waste Log'
              )}
            </Button>
            {!isLocationValid && (
              <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-3">
                Location must be verified before submitting.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
