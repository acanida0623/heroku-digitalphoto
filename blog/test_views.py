from django.test import TestCase
from .models import Image

class ViewsTestCase(TestCase):

    def test_get_home_ok(self):
        response = self.client.get('/accounts/login/')
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'registration/login.html')
