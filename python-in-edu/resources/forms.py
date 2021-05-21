from django import forms
from .models import Resource, ResourceType, ResourceAudience, Device, ResourceUseType, ResourceLanguage


class CreateResourceForm(forms.ModelForm):
    class Meta:
        model = Resource
        # fields = '__all__'
        fields = [
            'title',
            'description',
            'requires_signup',
            'license',
        ]

    description = forms.Textarea()

    resource_types = forms.ModelMultipleChoiceField(
        queryset=ResourceType.objects.all(),
        widget=forms.CheckboxSelectMultiple
    )

    audience = forms.ModelMultipleChoiceField(
        queryset=ResourceAudience.objects.all(),
        widget=forms.CheckboxSelectMultiple
    )

    devices = forms.ModelMultipleChoiceField(
        queryset=Device.objects.all(),
        widget=forms.CheckboxSelectMultiple
    )

    use_type = forms.ModelMultipleChoiceField(
        queryset=ResourceUseType.objects.all(),
        widget=forms.CheckboxSelectMultiple
    )

    languages = forms.ModelMultipleChoiceField(
        queryset=ResourceLanguage.objects.all(),
        widget=forms.CheckboxSelectMultiple
    )
