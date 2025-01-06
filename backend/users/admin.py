from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Sector, CustomUser, Profile



class SectorAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')  # Columns to display in the list view
    search_fields = ('name',)  # Add a search bar for the 'name' field



class ProfileInline(admin.StackedInline):
    model = Profile
    can_delete = False  # Prevent deletion from inline
    verbose_name_plural = 'Profile'  # Displayed label
    fk_name = 'user'  # ForeignKey linking Profile to CustomUser
    

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    inlines = [ProfileInline]  # Add Profile inline
    list_display = ('username', 'email', 'is_staff', 'is_active', 'get_sectors')
    list_filter = ('is_staff', 'is_active')
    fieldsets = (
        (None, {'fields': ('username', 'email', 'password', 'sectors')}),
        ('Permissions', {'fields': ('is_staff', 'is_active', 'is_superuser')}),
        ('Groups', {'fields': ('groups', 'user_permissions')}),        
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'sectors', 'is_staff', 'is_active'),
        }),
    )
    search_fields = ('username', 'email')
    ordering = ('email',)
    
    def get_sectors(self, obj):
        return ", ".join([sector.name for sector in obj.sectors.all()])
    get_sectors.short_description = 'Sectors'

admin.site.register(Sector, SectorAdmin) 
admin.site.register(CustomUser, CustomUserAdmin)  
admin.site.register(Profile)  
